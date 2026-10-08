-- Weekly cap controls. Preserves the application's existing anonymous/admin-code access model.
BEGIN;
SET LOCAL lock_timeout = '5s';
LOCK TABLE public.bookings IN ACCESS EXCLUSIVE MODE;
CREATE SCHEMA IF NOT EXISTS broker_cap_private;
REVOKE ALL ON SCHEMA broker_cap_private FROM PUBLIC, anon, authenticated;

CREATE TABLE public.broker_cap_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  weekly_caps_enabled boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL CHECK (length(trim(updated_by)) > 0)
);
INSERT INTO public.broker_cap_settings(updated_by) VALUES ('Initial setup');
CREATE TABLE public.broker_weekly_limits (
  broker_name text PRIMARY KEY,
  weekly_cap integer CHECK (weekly_cap IS NULL OR weekly_cap >= 0),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL CHECK (length(trim(updated_by)) > 0)
);
CREATE TABLE public.broker_weekly_usage (
  broker_name text NOT NULL,
  week_start date NOT NULL,
  used bigint NOT NULL CHECK (used >= 0),
  PRIMARY KEY (broker_name, week_start)
);
ALTER TABLE public.broker_cap_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_weekly_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_weekly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.broker_cap_settings, public.broker_weekly_limits, public.broker_weekly_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.broker_cap_settings, public.broker_weekly_limits, public.broker_weekly_usage TO anon;
GRANT UPDATE (weekly_caps_enabled, updated_by) ON public.broker_cap_settings TO anon;
GRANT INSERT (broker_name, weekly_cap, updated_by), UPDATE (weekly_cap, updated_by) ON public.broker_weekly_limits TO anon;
CREATE POLICY cap_settings_read ON public.broker_cap_settings FOR SELECT TO anon USING (true);
CREATE POLICY cap_settings_update ON public.broker_cap_settings FOR UPDATE TO anon USING (id) WITH CHECK (id);
CREATE POLICY weekly_limits_read ON public.broker_weekly_limits FOR SELECT TO anon USING (true);
CREATE POLICY weekly_limits_insert ON public.broker_weekly_limits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY weekly_limits_update ON public.broker_weekly_limits FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY weekly_usage_read ON public.broker_weekly_usage FOR SELECT TO anon USING (true);

ALTER TABLE public.bookings ADD COLUMN request_id uuid;
ALTER TABLE public.bookings ADD COLUMN cap_recorded_at timestamptz;
UPDATE public.bookings SET cap_recorded_at = created_at;
ALTER TABLE public.bookings ALTER COLUMN cap_recorded_at SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN cap_recorded_at SET DEFAULT statement_timestamp();
CREATE UNIQUE INDEX bookings_request_id_key ON public.bookings(request_id);
CREATE INDEX bookings_broker_cap_recorded_idx ON public.bookings(broker_name, cap_recorded_at);

CREATE FUNCTION public.broker_week_start(p_at timestamptz)
RETURNS date LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER SET search_path = '' AS $$
  SELECT date_trunc('week', p_at AT TIME ZONE 'America/New_York')::date
$$;
INSERT INTO public.broker_weekly_usage(broker_name, week_start, used)
SELECT broker_name, public.broker_week_start(cap_recorded_at), count(*)
FROM public.bookings GROUP BY 1, 2;

CREATE FUNCTION broker_cap_private.prepare_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.id, NEW.broker_name, NEW.created_at, NEW.date_est, NEW.request_id, NEW.cap_recorded_at)
       IS DISTINCT FROM
       (OLD.id, OLD.broker_name, OLD.created_at, OLD.date_est, OLD.request_id, OLD.cap_recorded_at) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Booking identity and accounting date cannot be changed';
    END IF;
  ELSE
    NEW.cap_recorded_at := statement_timestamp();
    -- Legacy screens undo by the timestamp they submitted. Preserve it until refreshed.
    -- Weekly accounting ALWAYS uses the separate server-owned cap_recorded_at.
    IF NEW.request_id IS NOT NULL THEN
      NEW.created_at := NEW.cap_recorded_at;
      NEW.date_est := to_char(NEW.cap_recorded_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION broker_cap_private.account_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_enabled boolean; v_cap integer; v_week date; v_used bigint;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.broker_weekly_usage SET used = used - 1
    WHERE broker_name = OLD.broker_name
      AND week_start = public.broker_week_start(OLD.cap_recorded_at) AND used > 0;
    IF NOT FOUND THEN RAISE EXCEPTION 'Weekly usage is inconsistent; reconcile before deleting'; END IF;
    RETURN OLD;
  END IF;
  SELECT weekly_caps_enabled INTO STRICT v_enabled FROM public.broker_cap_settings WHERE id FOR SHARE;
  -- Shared lock order for booking and cap edits: broker, then weekly counter.
  PERFORM 1 FROM public.brokers WHERE broker_name = NEW.broker_name FOR UPDATE;
  IF NOT FOUND AND v_enabled THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Broker is no longer in the roster';
  END IF;
  IF v_enabled THEN
    SELECT weekly_cap INTO v_cap FROM public.broker_weekly_limits WHERE broker_name = NEW.broker_name;
  END IF;
  IF v_cap = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Weekly broker cap reached';
  END IF;
  v_week := public.broker_week_start(NEW.cap_recorded_at);
  INSERT INTO public.broker_weekly_usage AS u (broker_name, week_start, used)
  VALUES (NEW.broker_name, v_week, 1)
  ON CONFLICT (broker_name, week_start) DO UPDATE SET used = u.used + 1
    WHERE v_cap IS NULL OR u.used < v_cap
  RETURNING used INTO v_used;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Weekly broker cap reached';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER prepare_capped_booking BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.prepare_booking();
CREATE TRIGGER account_capped_booking AFTER INSERT OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.account_booking();
REVOKE TRUNCATE ON public.bookings FROM anon, authenticated;

CREATE FUNCTION broker_cap_private.prepare_control()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'broker_weekly_limits' THEN
    IF TG_OP = 'UPDATE' AND NEW.broker_name IS DISTINCT FROM OLD.broker_name THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Broker limit identity cannot be changed';
    END IF;
    PERFORM 1 FROM public.brokers WHERE broker_name = NEW.broker_name FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'Broker is no longer in the roster'; END IF;
  END IF;
  NEW.updated_at := clock_timestamp();
  NEW.revision := CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE OLD.revision + 1 END;
  RETURN NEW;
END;
$$;
CREATE FUNCTION broker_cap_private.audit_control()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.broker_audit_log(admin_name, action, broker_name, summary, before_data, after_data)
  VALUES (NEW.updated_by,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN 'weekly_cap_feature_changed' ELSE 'weekly_cap_changed' END,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN NULL ELSE to_jsonb(NEW)->>'broker_name' END,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN 'Weekly cap feature setting saved' ELSE 'Broker weekly cap saved' END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, to_jsonb(NEW));
  RETURN NEW;
END;
$$;
CREATE TRIGGER prepare_cap_settings BEFORE UPDATE ON public.broker_cap_settings
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.prepare_control();
CREATE TRIGGER audit_cap_settings AFTER UPDATE ON public.broker_cap_settings
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.audit_control();
CREATE TRIGGER prepare_weekly_limit BEFORE INSERT OR UPDATE ON public.broker_weekly_limits
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.prepare_control();
CREATE TRIGGER audit_weekly_limit AFTER INSERT OR UPDATE ON public.broker_weekly_limits
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.audit_control();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA broker_cap_private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.get_broker_weekly_usage()
RETURNS TABLE(broker_name text, weekly_cap integer, weekly_used bigint, cap_revision bigint,
  weekly_caps_enabled boolean, week_start date, resets_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT b.broker_name, l.weekly_cap, coalesce(u.used, 0), coalesce(l.revision, 0),
    s.weekly_caps_enabled, w.start_date, (w.start_date + 7)::timestamp AT TIME ZONE 'America/New_York'
  FROM public.brokers b
  CROSS JOIN public.broker_cap_settings s
  CROSS JOIN (SELECT public.broker_week_start(statement_timestamp()) AS start_date) w
  LEFT JOIN public.broker_weekly_limits l ON l.broker_name = b.broker_name
  LEFT JOIN public.broker_weekly_usage u ON u.broker_name = b.broker_name AND u.week_start = w.start_date
  WHERE s.id
$$;

CREATE FUNCTION public.set_broker_cap_settings(p_enabled boolean, p_revision bigint, p_admin_name text)
RETURNS public.broker_cap_settings LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.broker_cap_settings;
BEGIN
  UPDATE public.broker_cap_settings SET weekly_caps_enabled = p_enabled, updated_by = trim(p_admin_name)
  WHERE id AND revision = p_revision RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Settings changed in another session. Refresh and retry.'; END IF;
  RETURN v_row;
END;
$$;
CREATE FUNCTION public.set_broker_weekly_cap(p_broker_name text, p_cap integer, p_revision bigint, p_admin_name text)
RETURNS public.broker_weekly_limits LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.broker_weekly_limits;
BEGIN
  IF p_revision = 0 THEN
    INSERT INTO public.broker_weekly_limits(broker_name, weekly_cap, updated_by)
    VALUES (p_broker_name, p_cap, trim(p_admin_name)) ON CONFLICT (broker_name) DO NOTHING RETURNING * INTO v_row;
  ELSE
    UPDATE public.broker_weekly_limits SET weekly_cap = p_cap, updated_by = trim(p_admin_name)
    WHERE broker_name = p_broker_name AND revision = p_revision RETURNING * INTO v_row;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Broker cap changed in another session. Refresh and retry.'; END IF;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.broker_week_start(timestamptz), public.get_broker_weekly_usage(),
  public.set_broker_cap_settings(boolean,bigint,text), public.set_broker_weekly_cap(text,integer,bigint,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.broker_week_start(timestamptz), public.get_broker_weekly_usage(),
  public.set_broker_cap_settings(boolean,bigint,text), public.set_broker_weekly_cap(text,integer,bigint,text)
  TO anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
