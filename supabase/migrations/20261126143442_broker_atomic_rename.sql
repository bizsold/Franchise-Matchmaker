-- Requires weekly_broker_cap_controls. No existing records are renamed on installation.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'broker_name'
      AND table_name NOT IN ('brokers','bookings','broker_weekly_limits','broker_weekly_usage',
        'broker_focus','broker_locks','booking_events','broker_audit_log')) THEN
    RAISE EXCEPTION 'Unreviewed broker_name dependency; inspect before installing rename support';
  END IF;
  IF EXISTS (
    SELECT FROM (SELECT broker_name,public.broker_week_start(cap_recorded_at) w,count(*) n
      FROM public.bookings GROUP BY 1,2)b FULL JOIN public.broker_weekly_usage u
      ON b.broker_name=u.broker_name AND b.w=u.week_start
    WHERE coalesce(b.n,0)<>coalesce(u.used,0)
  ) THEN RAISE EXCEPTION 'Weekly counts need reconciliation before installing rename support'; END IF;
END $$;

-- Private, transaction-scoped authorization for the accounting triggers. Browser roles
-- cannot create a context, unlike a spoofable custom GUC/session variable.
CREATE TABLE broker_cap_private.rename_context (
  transaction_id bigint PRIMARY KEY, old_name text NOT NULL, new_name text NOT NULL
);
CREATE TABLE broker_cap_private.retired_broker_names (
  old_name text PRIMARY KEY, current_name text NOT NULL
);
REVOKE ALL ON broker_cap_private.rename_context, broker_cap_private.retired_broker_names
FROM PUBLIC, anon, authenticated;

CREATE FUNCTION broker_cap_private.is_broker_rename(p_old text, p_new text)
RETURNS boolean LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM broker_cap_private.rename_context
    WHERE transaction_id = txid_current() AND old_name = p_old AND new_name = p_new)
$$;

CREATE FUNCTION broker_cap_private.guard_retired_broker_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_current text;
BEGIN
  IF TG_TABLE_NAME = 'brokers' THEN
    NEW.data := NEW.data || jsonb_build_object('name',NEW.broker_name);
    NEW.updated_at := clock_timestamp();
  END IF;
  SELECT current_name INTO v_current FROM broker_cap_private.retired_broker_names
    WHERE old_name = NEW.broker_name;
  IF FOUND THEN
    -- Late telemetry/undo events still belong to the renamed broker. Booking writes
    -- and stale roster/settings saves must fail closed instead of recreating it.
    IF TG_TABLE_NAME IN ('booking_events', 'broker_audit_log') THEN
      NEW.broker_name := v_current;
    ELSE
      RAISE EXCEPTION USING ERRCODE = '40001',
        MESSAGE = 'This broker has been renamed. Refresh the page before saving.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION broker_cap_private.cascade_broker_rename()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_table text; v_found boolean;
BEGIN
  IF NEW.broker_name IS NOT DISTINCT FROM OLD.broker_name THEN RETURN NEW; END IF;
  IF NEW.broker_name IS NULL OR trim(NEW.broker_name) = '' OR NEW.broker_name <> trim(NEW.broker_name) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Enter a nonempty broker name without surrounding spaces';
  END IF;
  -- A rename is rare. Serialize all affected writes for this short transaction.
  -- NOWAIT avoids lock-order deadlocks with in-flight booking/cap transactions;
  -- the caller retries after refreshing rather than partially renaming anything.
  LOCK TABLE public.brokers, public.bookings, public.broker_weekly_limits,
    public.broker_weekly_usage, public.broker_focus, public.broker_locks,
    public.booking_events, public.broker_audit_log IN SHARE ROW EXCLUSIVE MODE NOWAIT;
  IF EXISTS (SELECT FROM broker_cap_private.retired_broker_names WHERE old_name = NEW.broker_name)
     OR EXISTS (SELECT FROM public.brokers WHERE lower(trim(broker_name)) = lower(NEW.broker_name)
                AND broker_name <> NEW.broker_name) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'That broker name already exists or is reserved';
  END IF;
  -- Do not merge another broker's orphaned history, even when no roster row exists.
  FOREACH v_table IN ARRAY ARRAY['bookings','broker_weekly_limits','broker_weekly_usage',
      'broker_focus','broker_locks','booking_events','broker_audit_log'] LOOP
    EXECUTE format('SELECT EXISTS (SELECT FROM public.%I WHERE lower(trim(broker_name)) = lower($1) AND broker_name <> $2)', v_table)
      INTO STRICT v_found USING NEW.broker_name, OLD.broker_name;
    IF v_found THEN
      RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'That name already has history or settings; choose another name';
    END IF;
  END LOOP;
  INSERT INTO broker_cap_private.rename_context VALUES(txid_current(), OLD.broker_name, NEW.broker_name);
  UPDATE public.bookings SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.broker_weekly_limits SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.broker_weekly_usage SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.broker_focus SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.broker_locks SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.booking_events SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE public.broker_audit_log SET broker_name = NEW.broker_name WHERE broker_name = OLD.broker_name;
  UPDATE broker_cap_private.retired_broker_names SET current_name = NEW.broker_name WHERE current_name = OLD.broker_name;
  INSERT INTO broker_cap_private.retired_broker_names VALUES(OLD.broker_name, NEW.broker_name);
  DELETE FROM broker_cap_private.rename_context WHERE transaction_id = txid_current();
  INSERT INTO public.broker_audit_log(admin_name, action, broker_name, summary, before_data, after_data)
  VALUES(coalesce(nullif(current_setting('app.rename_admin',true),''),'Database caller'),
    'broker_renamed', NEW.broker_name, 'Broker renamed from ' || OLD.broker_name || ' to ' || NEW.broker_name,
    to_jsonb(OLD), to_jsonb(NEW));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION broker_cap_private.prepare_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.id, NEW.created_at, NEW.date_est, NEW.request_id, NEW.cap_recorded_at)
       IS DISTINCT FROM (OLD.id, OLD.created_at, OLD.date_est, OLD.request_id, OLD.cap_recorded_at)
       OR (NEW.broker_name IS DISTINCT FROM OLD.broker_name
         AND NOT broker_cap_private.is_broker_rename(OLD.broker_name, NEW.broker_name)) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Booking identity and accounting date cannot be changed';
    END IF;
  ELSE
    NEW.cap_recorded_at := statement_timestamp();
    IF NEW.request_id IS NOT NULL THEN
      NEW.created_at := NEW.cap_recorded_at;
      NEW.date_est := to_char(NEW.cap_recorded_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION broker_cap_private.prepare_control()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'broker_weekly_limits' THEN
    IF TG_OP = 'UPDATE' AND NEW.broker_name IS DISTINCT FROM OLD.broker_name THEN
      IF broker_cap_private.is_broker_rename(OLD.broker_name,NEW.broker_name) THEN
        RETURN NEW; -- Preserve the limit, its revision, and its original attribution.
      END IF;
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

-- Renaming a limit is covered by the broker rename audit, not a new cap edit.
CREATE OR REPLACE FUNCTION broker_cap_private.audit_control()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'broker_weekly_limits' AND TG_OP = 'UPDATE' THEN
    IF broker_cap_private.is_broker_rename(OLD.broker_name,NEW.broker_name) THEN RETURN NEW; END IF;
  END IF;
  INSERT INTO public.broker_audit_log(admin_name, action, broker_name, summary, before_data, after_data)
  VALUES (NEW.updated_by,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN 'weekly_cap_feature_changed' ELSE 'weekly_cap_changed' END,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN NULL ELSE to_jsonb(NEW)->>'broker_name' END,
    CASE WHEN TG_TABLE_NAME = 'broker_cap_settings' THEN 'Weekly cap feature setting saved' ELSE 'Broker weekly cap saved' END,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, to_jsonb(NEW));
  RETURN NEW;
END;
$$;

CREATE TRIGGER cascade_broker_rename AFTER UPDATE OF broker_name ON public.brokers
FOR EACH ROW EXECUTE FUNCTION broker_cap_private.cascade_broker_rename();

DO $$ DECLARE v_table text; BEGIN
  FOREACH v_table IN ARRAY ARRAY['brokers','bookings','broker_weekly_limits','broker_focus',
    'broker_locks','booking_events','broker_audit_log'] LOOP
    EXECUTE format('CREATE TRIGGER guard_retired_broker_name BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION broker_cap_private.guard_retired_broker_name()',v_table);
  END LOOP;
END $$;

CREATE FUNCTION public.rename_broker(p_old_name text, p_new_name text, p_data jsonb,
  p_expected_updated_at timestamptz, p_admin_name text)
RETURNS public.brokers LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_row public.brokers;
BEGIN
  IF p_new_name IS NULL OR trim(p_new_name) = '' OR p_new_name <> trim(p_new_name)
    OR p_old_name IS NOT DISTINCT FROM p_new_name OR p_expected_updated_at IS NULL
    OR p_admin_name IS NULL OR trim(p_admin_name) = '' OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'Invalid rename request. Refresh and retry.';
  END IF;
  PERFORM set_config('app.rename_admin',trim(p_admin_name),true);
  UPDATE public.brokers SET broker_name = p_new_name,
    data = p_data || jsonb_build_object('name',p_new_name), updated_at = clock_timestamp()
  WHERE broker_name = p_old_name AND updated_at = p_expected_updated_at RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '40001', MESSAGE = 'Broker changed in another session. Refresh and retry.';
  END IF;
  RETURN v_row;
END;
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA broker_cap_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rename_broker(text,text,jsonb,timestamptz,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rename_broker(text,text,jsonb,timestamptz,text) TO anon;
NOTIFY pgrst, 'reload schema';
COMMIT;
