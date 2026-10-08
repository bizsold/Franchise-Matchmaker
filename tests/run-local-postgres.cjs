// Starts only an isolated localhost PostgreSQL instance; never reads production credentials.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {Client}=require('pg');
(async()=>{
 const bins=await import('@embedded-postgres/windows-x64');
 const root=path.resolve(__dirname,'..'),scratch=path.join(root,'.test-work');
 fs.mkdirSync(scratch,{recursive:true});
 const data=path.join(scratch,'postgres'),log=path.join(scratch,'postgres.log');
 const call=(bin,args)=>cp.execFileSync(bin,args,{windowsHide:true,stdio:'ignore',timeout:60000});
 if(!fs.existsSync(path.join(data,'PG_VERSION')))call(bins.initdb,['-D',data,'-A','trust','-U','postgres','--no-locale','-E','UTF8']);
 const name='caps_test_'+Date.now();let started=false,admin,db,created=false;
 try{
  try{call(bins.pg_ctl,['-D',data,'status']);}
  catch{call(bins.pg_ctl,['-D',data,'-l',log,'-o','-p 55439 -h 127.0.0.1','-w','start']);}
  started=true;
  const config={host:'127.0.0.1',port:55439,user:'postgres',database:'postgres'};
  admin=new Client(config);await admin.connect();
  await admin.query(`DO $$ BEGIN
   IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
   IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  END $$`);
  await admin.query(`CREATE DATABASE ${name}`);created=true;config.database=name;
  const connect=async()=>{const c=new Client(config);await c.connect();return c;};
  db=await connect();console.log((await db.query('SELECT version()')).rows[0].version);
  await db.query(`
  CREATE TABLE public.brokers(broker_name text PRIMARY KEY,data jsonb NOT NULL,updated_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE public.bookings(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,broker_name text NOT NULL,setter_name text,lead_city text,lead_state text,date_est text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE public.broker_audit_log(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,changed_at timestamptz NOT NULL DEFAULT now(),admin_name text NOT NULL,action text NOT NULL,broker_name text,summary text NOT NULL,before_data jsonb,after_data jsonb);
  ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY bookings_anon ON public.bookings FOR ALL TO anon USING(true) WITH CHECK(true);
  CREATE POLICY brokers_anon ON public.brokers FOR ALL TO anon USING(true) WITH CHECK(true);
  GRANT ALL ON public.bookings,public.brokers TO anon;GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
  INSERT INTO public.brokers(broker_name,data) VALUES('Test','{}'),('Unlimited','{}');
  INSERT INTO public.bookings(broker_name,date_est,created_at) VALUES('Old roster name','2025-12-31','2025-12-31T20:00:00Z');`);
  await db.query(fs.readFileSync(path.join(root,'supabase/migrations/20261008203016_weekly_broker_cap_controls.sql'),'utf8'));
  await require('./weekly-caps.integration.cjs')(db,connect);
 }finally{
  if(db)await db.end();
  if(admin){if(created)await admin.query(`DROP DATABASE ${name}`);await admin.end();}
  if(started)call(bins.pg_ctl,['-D',data,'-m','fast','-w','stop']);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
