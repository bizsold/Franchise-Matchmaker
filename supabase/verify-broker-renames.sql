-- Read-only. Expected: no mismatch rows, rename available, private context denied.
SELECT coalesce(b.broker_name,u.broker_name) AS broker_name,
       coalesce(b.w,u.week_start) AS week_start, coalesce(b.n,0) AS bookings,coalesce(u.used,0) AS used
FROM (SELECT broker_name,public.broker_week_start(cap_recorded_at) w,count(*) n
      FROM public.bookings GROUP BY 1,2)b
FULL JOIN public.broker_weekly_usage u ON b.broker_name=u.broker_name AND b.w=u.week_start
WHERE coalesce(b.n,0)<>coalesce(u.used,0);

SELECT has_function_privilege('anon','public.rename_broker(text,text,jsonb,timestamptz,text)','EXECUTE') AS rename_available,
       NOT has_table_privilege('anon','broker_cap_private.rename_context','INSERT') AS private_context_denied;
SELECT count(*) AS active_contexts FROM broker_cap_private.rename_context;
SELECT * FROM public.get_broker_weekly_usage();
SELECT * FROM public.broker_cap_settings;
