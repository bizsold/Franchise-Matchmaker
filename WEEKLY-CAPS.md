# Weekly cap controls

## Deployment status

**Production backend deployed with explicit user approval on October 8, 2026.** The local Franchise Matchmaker project is updated. Live verification: 1,554 booking records accounted for, zero counter mismatches, 58 brokers, enforcement off, and no configured limits. The anonymous read APIs passed and Supabase security advisors returned no findings.

Migration `supabase/migrations/20261008203016_weekly_broker_cap_controls.sql` has been applied to Supabase project `ohiholwyaagawjqyocpq`. Do not reapply it. The local project files are updated. If using a hosted copy, publish `app.js`, `brokers.js`, `brokers.html`, and new `broker-caps-admin.js` together; no hosted frontend deployment was performed in this chat.

The migration starts with enforcement **off** and every broker **unlimited**. Booking counts are maintained while off. Open Brokers Admin → Weekly booking caps, save individual limits, then check **Enforce weekly caps** and save the feature setting.

## Behavior

- A shared backend switch controls enforcement for every browser and direct booking insert.
- Each broker has an optional whole-number limit. Blank means unlimited; zero blocks all new bookings when enforcement is on.
- Monday 00:00 through the following Monday 00:00, America/New_York. The database assigns accounting time; calendar appointment time does not determine the week. DST transitions are handled as local calendar weeks.
- Existing daily filtering and backup behavior remain; weekly limits also block backups.
- Unbooking releases capacity in the original week. The existing admin Unbook Today action still removes all of that broker's bookings for today.
- Turning enforcement off preserves limits and counts. Turning it back on immediately uses the current week's count, including bookings made while off.
- Reducing a cap below usage preserves existing bookings and prevents further bookings.
- Backend optimistic revisions reject stale admin saves. Changes to the switch and per-broker limits are audited transactionally.
- The original timestamp is preserved for legacy clients without a request ID, keeping old undo actions working. Accounting always uses the server-owned `cap_recorded_at`. New clients save returned booking IDs and timestamps and undo by ID.
- Request IDs prevent duplicates for retries of the same UI booking action. They are not persisted across page reloads.
- Renaming through the form is blocked: moving booking history and saved limits requires an explicit database migration. Limits and usage survive deletion/recreation under the same broker name.

## Database implementation

`broker_cap_settings` stores the global switch; `broker_weekly_limits` stores optional per-broker limits; `broker_weekly_usage` stores atomic counters by broker and local week. Limits are separate from `brokers.data`, so old roster upserts cannot clear them.

Private trigger functions maintain accounting and audit records. Public read/save RPCs run with caller privileges. All new public tables have RLS and explicit grants. The counter table is read-only for browser clients. Accounting identities cannot be edited and browser clients cannot truncate bookings.

Booking transactions share-lock the settings row, lock the broker row, then conditionally increment the week's counter. A cap failure rolls back the booking and counter together. The global toggle waits for in-flight bookings rather than retroactively changing them. No reset job or Edge Function is necessary.

## Access model

This implementation retains the existing application's **anonymous Supabase role plus browser admin code**. The database has no authenticated user accounts. Controls are backend-persisted and backend-enforced, but the existing admin code is not server-side authentication: a caller with the public API key can edit controls or delete bookings under the current policies. Admin names in audit records are operator-supplied labels. Real role-based admin authorization is a separate authentication change.

## Testing

48 passing checks: 29 PostgreSQL 17.6 integration tests, 11 application tests, and 8 headless Edge browser tests. Database tests include actual separate concurrent sessions competing for the final slot, feature-toggle ordering, rollback, cap edits, unbooking, legacy-client compatibility, and DST. Browser tests use mocked Supabase responses and never write production data. Desktop and mobile layouts were visually inspected.

From this project on Windows: `npm ci`, then `npm test`. Test dependencies are development-only; the website remains static. Tests use an isolated localhost database with synthetic records, not production credentials. Port 55439 must be available. Headless browser tests use the installed Microsoft Edge.

## Verify after deployment

Run `supabase/verify-weekly-caps.sql`. Confirm the reconciliation query returns no rows, settings show enforcement off, and the anonymous read RPC is available. Verify the controls render in the published admin page before assigning limits and enabling enforcement.

If enforcement causes an operational problem, turn it off in Brokers Admin. In SQL, update the singleton settings row with `weekly_caps_enabled=false` and a nonempty `updated_by`. Keep tracking and data intact. Avoid dropping accounting tables or triggers as a quick rollback.
