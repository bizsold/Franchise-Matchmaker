const assert = require('node:assert/strict');
module.exports = async (db, connect) => {
  let passed = 0;
  const q = async (sql, args=[]) => (await db.query(sql,args)).rows;
  const check = async (name, fn) => { await fn(); passed++; console.log('PASS rename: '+name); };
  const reject = (sql, code, args=[]) => assert.rejects(q(sql,args),e=>e.code===code);
  const row = async name => (await q('SELECT *, updated_at::text AS version FROM brokers WHERE broker_name=$1',[name]))[0];
  const rename = async (oldName,newName,version) => {
    const old = await row(oldName);
    return q('SELECT * FROM public.rename_broker($1,$2,$3,$4,$5)',
      [oldName,newName,{...old?.data,name:newName},version || old?.version,'Test Admin']);
  };
  await q("UPDATE broker_cap_settings SET weekly_caps_enabled=false,updated_by='Test Admin'");
  await q(`INSERT INTO brokers(broker_name,data) VALUES('Rename source','{"name":"Rename source","booking":"https://example.com","top_priority":true}'),('Occupied','{}');
    INSERT INTO broker_focus VALUES('Rename source',true,now());
    INSERT INTO broker_locks VALUES('Rename source',true,now());
    INSERT INTO bookings(broker_name,date_est,request_id) VALUES('Rename source','2026-01-01',gen_random_uuid()),('Rename source','2026-01-02',gen_random_uuid());
    INSERT INTO booking_events(broker_name,event_type) VALUES('Rename source','booked');
    SELECT set_broker_weekly_cap('Rename source',2,0,'Test Admin');`);
  const beforeBooking = await q("SELECT to_jsonb(b)-'broker_name' AS value FROM bookings b WHERE broker_name='Rename source' ORDER BY id");
  const beforeLimit = await q("SELECT to_jsonb(l)-'broker_name' AS value FROM broker_weekly_limits l WHERE broker_name='Rename source'");
  const beforeUsage = await q("SELECT to_jsonb(u)-'broker_name' AS value FROM broker_weekly_usage u WHERE broker_name='Rename source'");
  await check('rejects occupied destination without changes',async()=>{
    await assert.rejects(rename('Rename source','Occupied'),e=>e.code==='23505');
    assert.ok(await row('Rename source'));
  });
  await check('rejects orphaned destination history',async()=>{
    await q("INSERT INTO booking_events(broker_name,event_type) VALUES('History only','booked')");
    await assert.rejects(rename('Rename source','History only'),e=>e.code==='23505');
  });
  await check('rejects stale revision',()=>assert.rejects(rename('Rename source','Renamed','2000-01-01'),e=>e.code==='40001'));
  await check('anonymous RPC moves all dependencies atomically',async()=>{
    await q('SET ROLE anon');
    await rename('Rename source','Renamed');
    await q('RESET ROLE');
    assert.equal(await row('Rename source'),undefined);
    assert.equal((await row('Renamed')).data.name,'Renamed');
    assert.equal((await row('Renamed')).data.top_priority,true);
    for (const table of ['bookings','broker_weekly_limits','broker_weekly_usage','broker_focus','broker_locks','booking_events','broker_audit_log']) {
      assert.equal((await q(`SELECT count(*)::int n FROM ${table} WHERE broker_name='Rename source'`))[0].n,0);
      assert.ok((await q(`SELECT count(*)::int n FROM ${table} WHERE broker_name='Renamed'`))[0].n>0);
    }
  });
  await check('preserves booking IDs, request IDs, dates and all other booking fields',async()=>{
    assert.deepEqual(await q("SELECT to_jsonb(b)-'broker_name' AS value FROM bookings b WHERE broker_name='Renamed' ORDER BY id"),beforeBooking);
  });
  await check('preserves limit revisions, attribution and counters exactly',async()=>{
    assert.deepEqual(await q("SELECT to_jsonb(l)-'broker_name' AS value FROM broker_weekly_limits l WHERE broker_name='Renamed'"),beforeLimit);
    assert.deepEqual(await q("SELECT to_jsonb(u)-'broker_name' AS value FROM broker_weekly_usage u WHERE broker_name='Renamed'"),beforeUsage);
  });
  await check('audit retains original snapshot and records operator and both names',async()=>{
    const [a] = await q("SELECT * FROM broker_audit_log WHERE action='broker_renamed' AND broker_name='Renamed'");
    assert.equal(a.admin_name,'Test Admin');assert.equal(a.before_data.broker_name,'Rename source');assert.equal(a.after_data.broker_name,'Renamed');
    assert.equal((await q("SELECT after_data->>'broker_name' n FROM broker_audit_log WHERE action='weekly_cap_changed' AND broker_name='Renamed'"))[0].n,'Rename source');
  });
  await check('blocks stale roster, booking, focus, lock and cap writes even with caps off',async()=>{
    await q('SET ROLE anon');
    for (const sql of [
      "INSERT INTO brokers(broker_name,data) VALUES('Rename source','{}')",
      "INSERT INTO bookings(broker_name,date_est) VALUES('Rename source','2026-01-01')",
      "INSERT INTO broker_focus(broker_name,focus_today) VALUES('Rename source',false)",
      "INSERT INTO broker_locks(broker_name,hard_locked) VALUES('Rename source',false)",
      "SELECT set_broker_weekly_cap('Rename source',3,0,'Admin')"
    ]) await reject(sql,'40001');
    await q('RESET ROLE');
  });
  await check('late telemetry follows new reporting name',async()=>{
    await q("INSERT INTO booking_events(broker_name,event_type) VALUES('Rename source','unbooked')");
    assert.equal((await q("SELECT count(*)::int n FROM booking_events WHERE broker_name='Renamed'"))[0].n,2);
  });
  await check('client cannot spoof rename context or bypass booking identity checks',async()=>{
    await q('SET ROLE anon');
    await reject("INSERT INTO broker_cap_private.rename_context VALUES(txid_current(),'Renamed','Occupied')",'42501');
    await q("SELECT set_config('app.rename_admin','Spoofed',false)");
    await reject("UPDATE bookings SET broker_name='Occupied' WHERE broker_name='Renamed'",'23514');
    await reject("UPDATE bookings SET created_at=now() WHERE broker_name='Renamed'",'23514');
    await q('RESET ROLE');
  });
  await check('renamed broker still at cap, and undo by booking ID releases capacity',async()=>{
    await q("UPDATE broker_cap_settings SET weekly_caps_enabled=true,updated_by='Test Admin'");
    await reject("INSERT INTO bookings(broker_name,date_est) VALUES('Renamed','2026-01-01')",'23514');
    await q('DELETE FROM bookings WHERE id=$1',[beforeBooking[0].value.id]);
    const [u] = await q("SELECT * FROM get_broker_weekly_usage() WHERE broker_name='Renamed'");
    assert.equal(Number(u.weekly_used),1);assert.equal(u.weekly_cap,2);
    await q("INSERT INTO bookings(broker_name,date_est) VALUES('Renamed','2026-01-01')");
  });
  await check('failure late in cascade rolls back roster, history, limits, audit and aliases',async()=>{
    await q(`CREATE FUNCTION public.fail_rename_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.action='broker_renamed' THEN RAISE EXCEPTION 'Injected failure'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER fail_rename_test BEFORE INSERT ON broker_audit_log FOR EACH ROW EXECUTE FUNCTION public.fail_rename_test();`);
    await assert.rejects(rename('Renamed','Rollback target'),/Injected failure/);
    assert.ok(await row('Renamed')); assert.equal(await row('Rollback target'),undefined);
    assert.equal((await q("SELECT count(*)::int n FROM broker_cap_private.retired_broker_names WHERE old_name='Renamed'"))[0].n,0);
    assert.equal((await q('SELECT count(*)::int n FROM broker_cap_private.rename_context'))[0].n,0);
    await q('DROP TRIGGER fail_rename_test ON broker_audit_log; DROP FUNCTION public.fail_rename_test()');
  });
  await check('in-flight writes make rename fail safely, then retry succeeds',async()=>{
    const other = await connect();
    try {
      await other.query('BEGIN');
      await other.query("INSERT INTO booking_events(broker_name,event_type) VALUES('Renamed','booked')");
      await assert.rejects(rename('Renamed','Renamed again'),e=>e.code==='55P03');
      await other.query('COMMIT');
      await rename('Renamed','Renamed again');
    } finally { await other.end(); }
  });
  await check('late writes queued behind rename cannot resurrect old booking name',async()=>{
    const other = await connect();
    try {
      await q('BEGIN');await rename('Renamed again','Final name');
      const result = other.query("INSERT INTO bookings(broker_name,date_est) VALUES('Renamed again','2026-01-01')").then(()=>null,e=>e);
      await q('COMMIT');
      assert.equal((await result).code,'40001');
    } finally { await other.end(); }
  });
  await check('rename chains resolve telemetry and old names stay reserved',async()=>{
    await q("INSERT INTO booking_events(broker_name,event_type) VALUES('Rename source','booked')");
    assert.equal((await q("SELECT count(*)::int n FROM booking_events WHERE broker_name IN ('Rename source','Renamed','Renamed again')"))[0].n,0);
    await assert.rejects(rename('Final name','Rename source'),e=>e.code==='40001');
  });
  await check('case-only rename and Unicode names preserve counts',async()=>{
    await rename('Final name','FINAL NAME');await rename('FINAL NAME','Équipe O’Neil');
    assert.equal(Number((await q("SELECT * FROM get_broker_weekly_usage() WHERE broker_name='Équipe O’Neil'"))[0].weekly_used),2);
  });
  await check('historical weeks move intact and unbooking decrements the original week',async()=>{
    await q("INSERT INTO brokers(broker_name,data) VALUES('Rename historical fixture','{}')");
    const [old] = await q("SELECT * FROM bookings WHERE broker_name='Rename historical fixture'");
    await rename('Rename historical fixture','Historical rename');
    assert.equal(Number((await q("SELECT used FROM broker_weekly_usage WHERE broker_name='Historical rename'"))[0].used),1);
    await q('DELETE FROM bookings WHERE id=$1',[old.id]);
    assert.equal(Number((await q("SELECT used FROM broker_weekly_usage WHERE broker_name='Historical rename'"))[0].used),0);
  });
  await check('all historical and current weekly counters reconcile',async()=>{
    const rows=await q(`SELECT coalesce(b.broker_name,u.broker_name) FROM
      (SELECT broker_name,broker_week_start(cap_recorded_at) w,count(*) n FROM bookings GROUP BY 1,2)b
      FULL JOIN broker_weekly_usage u ON b.broker_name=u.broker_name AND b.w=u.week_start
      WHERE coalesce(b.n,0)<>coalesce(u.used,0)`);
    assert.deepEqual(rows,[]);
  });
  console.log(`${passed} broker rename database tests passed.`);
};
