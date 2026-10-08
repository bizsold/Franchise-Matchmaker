SELECT * FROM public.broker_cap_settings;
SELECT * FROM public.get_broker_weekly_usage() ORDER BY broker_name;
-- Must return zero rows:
WITH actual AS (
 SELECT broker_name, public.broker_week_start(cap_recorded_at) AS week_start, count(*) AS used
 FROM public.bookings GROUP BY 1,2
)
SELECT coalesce(a.broker_name,u.broker_name) AS broker_name,
       coalesce(a.week_start,u.week_start) AS week_start,
       coalesce(a.used,0) AS actual, coalesce(u.used,0) AS recorded
FROM actual a FULL JOIN public.broker_weekly_usage u USING(broker_name,week_start)
WHERE coalesce(a.used,0) <> coalesce(u.used,0);
