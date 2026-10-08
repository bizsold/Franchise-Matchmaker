// Disposable database only. Called by the local test harness with separate connections.
const assert=require('node:assert/strict');
module.exports=async function test(db,connect){
 let passed=0;
 const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
 const check=async(name,fn)=>{await fn();passed++;console.log('PASS '+name);};
 const fail=(sql,code,args=[])=>assert.rejects(q(sql,args),e=>e.code===code);
 const insert=(name='Test',id=null)=>q("INSERT INTO public.bookings(broker_name,date_est,created_at,request_id) VALUES($1,'1990-01-01','1990-01-01',$2) RETURNING *",[name,id]);
 const usage=async(name='Test')=>(await q('SELECT * FROM public.get_broker_weekly_usage() WHERE broker_name=$1',[name]))[0];
 const used=async(name='Test')=>Number((await usage(name)).weekly_used);
 const cap=async(value,name='Test')=>q('SELECT public.set_broker_weekly_cap($1,$2,$3,$4)',[name,value,Number((await usage(name)).cap_revision),'Test Admin']);
 const enable=async(value)=>q('SELECT public.set_broker_cap_settings($1,$2,$3)',[value,Number((await q('SELECT revision FROM public.broker_cap_settings'))[0].revision),'Test Admin']);
 await check('feature initially off',async()=>assert.equal((await usage()).weekly_caps_enabled,false));
 await check('all historical names backfilled',async()=>assert.equal(Number((await q("SELECT used FROM public.broker_weekly_usage WHERE broker_name='Old roster name'"))[0].used),1));
 await check('Monday boundary, year rollover and DST',async()=>{
  for(const [at,day] of [['2026-10-05T03:59:59Z','2026-09-28'],['2026-10-05T04:00:00Z','2026-10-05'],['2027-01-01T12:00:00Z','2026-12-28'],['2026-03-09T04:00:00Z','2026-03-09'],['2026-11-02T05:00:00Z','2026-11-02']])
   assert.equal((await q('SELECT public.broker_week_start($1)::text AS day',[at]))[0].day,day);
  const [h]=await q("SELECT extract(epoch FROM ((date '2026-03-09')::timestamp AT TIME ZONE 'America/New_York') - ((date '2026-03-02')::timestamp AT TIME ZONE 'America/New_York'))/3600 AS spring, extract(epoch FROM ((date '2026-11-02')::timestamp AT TIME ZONE 'America/New_York') - ((date '2026-10-26')::timestamp AT TIME ZONE 'America/New_York'))/3600 AS autumn");
  assert.equal(Number(h.spring),167);assert.equal(Number(h.autumn),169);
 });
 await check('anonymous cap save and atomic audit',async()=>{
  await q('SET ROLE anon');await cap(1);await q('RESET ROLE');
  assert.equal((await usage()).weekly_cap,1);
  assert.equal((await q("SELECT count(*)::int AS n FROM public.broker_audit_log WHERE action='weekly_cap_changed'"))[0].n,1);
 });
 await check('negative cap rejected',()=>assert.rejects(cap(-1),e=>e.code==='23514'));
 await check('blank admin name rejected',()=>fail("SELECT public.set_broker_weekly_cap('Test',2,1,' ')",'23514'));
 await check('stale cap edit rejected',()=>fail("SELECT public.set_broker_weekly_cap('Test',2,0,'Admin')",'40001'));
 let legacy, modern;
 await check('off mode counts bookings above cap',async()=>{[legacy]=await insert();[modern]=await insert('Test','11111111-1111-4111-8111-111111111111');assert.equal(await used(),2);});
 await check('legacy timestamp preserved but accounting uses server time',async()=>{assert.equal(legacy.date_est,'1990-01-01');assert.equal(legacy.created_at.getUTCFullYear(),1990);assert.notEqual(legacy.cap_recorded_at.getUTCFullYear(),1990);});
 await check('modern booking gets server timestamp',async()=>{assert.notEqual(modern.date_est,'1990-01-01');assert.equal(modern.created_at.getTime(),modern.cap_recorded_at.getTime());});
 await check('retry does not double count',async()=>{await assert.rejects(insert('Test','11111111-1111-4111-8111-111111111111'),e=>e.code==='23505');assert.equal(await used(),2);});
 await check('enabling immediately enforces already-recorded usage',async()=>{await q('SET ROLE anon');await enable(true);await q('RESET ROLE');await assert.rejects(insert(),e=>e.code==='23514');assert.equal(await used(),2);});
 await check('stale global setting rejected',()=>fail("SELECT public.set_broker_cap_settings(false,1,'Admin')",'40001'));
 await check('daily repeats still allowed below weekly cap',async()=>{await cap(3);await insert();assert.equal(await used(),3);});
 await check('hard weekly cap rejects direct anonymous insert',async()=>{await q('SET ROLE anon');await assert.rejects(insert(),e=>e.code==='23514');await q('RESET ROLE');assert.equal(await used(),3);});
 await check('deleting releases one slot',async()=>{await q('DELETE FROM public.bookings WHERE id=$1',[modern.id]);assert.equal(await used(),2);await insert();assert.equal(await used(),3);});
 await check('lower cap preserves bookings and blocks further writes',async()=>{await cap(1);await assert.rejects(insert(),e=>e.code==='23514');assert.equal(await used(),3);});
 await check('zero blocks, null is unlimited',async()=>{await cap(0,'Unlimited');await assert.rejects(insert('Unlimited'),e=>e.code==='23514');await cap(null,'Unlimited');await insert('Unlimited');await insert('Unlimited');assert.equal(await used('Unlimited'),2);});
 await check('disabling bypasses limit without resetting count',async()=>{await enable(false);await insert();assert.equal(await used(),4);await enable(true);});
 await check('accounting fields immutable',()=>fail("UPDATE public.bookings SET cap_recorded_at='1990-01-01' WHERE broker_name='Test'",'23514'));
 await check('unknown broker rejected with enforcement on',()=>assert.rejects(insert('Unknown'),e=>e.code==='23503'));
 await check('old-week delete does not affect this week',async()=>{await q("DELETE FROM public.bookings WHERE broker_name='Old roster name'");assert.equal(await used(),4);});
 await check('rollback restores accounting',async()=>{await q('BEGIN');await q("DELETE FROM public.bookings WHERE broker_name='Test'");assert.equal(await used(),0);await q('ROLLBACK');assert.equal(await used(),4);});
 await check('multirow overflow rolls back as a unit',async()=>{await cap(5);await fail("INSERT INTO public.bookings(broker_name,date_est) VALUES('Test','x'),('Test','x')",'23514');assert.equal(await used(),4);});
 await check('counter mutation and truncate denied to browser role',async()=>{await q('SET ROLE anon');await fail('UPDATE public.broker_weekly_usage SET used=0','42501');await fail('TRUNCATE public.bookings','42501');await fail('DELETE FROM public.broker_cap_settings','42501');await q('RESET ROLE');});
 await check('ordinary roster upsert cannot erase cap',async()=>{await q("INSERT INTO public.brokers(broker_name,data) VALUES('Test','{}') ON CONFLICT(broker_name) DO UPDATE SET data=excluded.data");assert.equal((await usage()).weekly_cap,5);});
 await check('two simultaneous sessions cannot consume the final slot twice',async()=>{
  const a=await connect(),b=await connect();
  try{
   await a.query('BEGIN');await b.query('BEGIN');await b.query("SET LOCAL statement_timeout='5s'");
   await a.query("INSERT INTO public.bookings(broker_name,date_est) VALUES('Test','x')");
   const pending=b.query("INSERT INTO public.bookings(broker_name,date_est) VALUES('Test','x')").then(()=>null,e=>e.code);
   await a.query('COMMIT');assert.equal(await pending,'23514');await b.query('ROLLBACK');assert.equal(await used(),5);
  }finally{await a.query('ROLLBACK');await b.query('ROLLBACK');await a.end();await b.end();}
 });
 await check('feature toggle waits for in-flight booking',async()=>{
  await cap(6);const a=await connect(),b=await connect();
  try{
   await a.query('BEGIN');await a.query("INSERT INTO public.bookings(broker_name,date_est) VALUES('Test','x')");
   await b.query("SET statement_timeout='5s'");let finished=false;
   const pending=b.query("UPDATE public.broker_cap_settings SET weekly_caps_enabled=false,updated_by='Test Admin' WHERE id").then(()=>{finished=true;});
   await new Promise(r=>setTimeout(r,100));assert.equal(finished,false);await a.query('COMMIT');await pending;
   assert.equal(await used(),6);assert.equal((await usage()).weekly_caps_enabled,false);
  }finally{await a.query('ROLLBACK');await a.end();await b.end();}
 });
 await check('full counter reconciliation',async()=>{
  const mismatches=await q(`WITH actual AS (SELECT broker_name,public.broker_week_start(cap_recorded_at) AS week_start,count(*) AS used FROM public.bookings GROUP BY 1,2)
  SELECT 1 FROM actual a FULL JOIN public.broker_weekly_usage u USING(broker_name,week_start) WHERE coalesce(a.used,0)<>coalesce(u.used,0)`);assert.equal(mismatches.length,0);
 });
 console.log(`${passed} PostgreSQL integration tests passed.`);return passed;
};
