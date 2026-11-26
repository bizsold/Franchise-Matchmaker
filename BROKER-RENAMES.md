# Safe broker renames

Database support was installed on November 26, 2026 in Supabase project `ohiholwyaagawjqyocpq` (Franchise Matchmaker). Migration: `supabase/migrations/20261126143442_broker_atomic_rename.sql`. Do not reapply it.

Publish **brokers.js and broker-caps-admin.js together** to the existing static host, then reload Broker Admin. These files are updated locally; no hosted frontend deployment was performed because this workspace has no hosting target or deployment configuration. No broker was renamed in production during this work.

## Cause and fix

The submit handler in `brokers.js` blocked changed names because the database uses `broker_name` as its identity. There is no broker ID column or foreign key relationship to reuse. The old unreachable rename path upserted a new roster row and deleted the old row separately, without moving history or limits.

The form now calls the invoker-rights `rename_broker` RPC with the original name and database timestamp, new name, edited criteria, and operator label. An AFTER UPDATE trigger performs the cascade in the same transaction. No delete/recreate operation is used.

The cascade moves bookings, all historical weekly counters, limits, focus settings, locks, booking events, and the broker name used for audit reporting. Booking IDs, request IDs, timestamps, dates, counts, cap revisions and attribution remain intact. Old audit summaries and before/after snapshots remain unchanged, and a new rename audit records both names and the operator. No report views or other broker-dependent database functions were found beyond the weekly-cap functions.

The form only changes its cache after confirmed success, preserves edits on failure, moves pending focus selections, and refreshes weekly usage. An editor's original revision survives background roster refreshes. Failed ordinary saves also no longer claim local success.

## Safeguards and limitations

- A short transaction takes write-conflicting table locks with NOWAIT. An in-flight write can make a rename return a retry message; no partial rename commits. Ordinary reads continue.
- Existing names and names with orphaned history/settings are rejected instead of merging brokers. Blank names and stale edits are rejected.
- Old names are permanently reserved. Stale roster, booking, cap, focus and lock writes fail with a refresh instruction, even when weekly enforcement is off. Late telemetry uses the current reporting name. Rename chains are supported; reusing a retired name requires a separately reviewed change.
- Private transaction context allows only the cascade to change accounting identities. Browser clients cannot create that context or directly rewrite booking identity. No trigger is disabled during a rename.
- The migration is transactional, has lock/statement timeouts, rejects unknown public `broker_name` dependencies, and checks weekly reconciliation before installation.
- The existing anonymous-role/browser-admin-code access model is retained. This change does not add server-side admin authentication; operator names remain supplied labels. Private trigger functions are inaccessible directly to browser roles, and the public RPC uses caller privileges.
- Future tables or integrations keyed by broker name must be added to the cascade or migrated to stable IDs. Previously exported external reports are not rewritten.

## Verification

`npm test` passed **70 checks**: 11 application, 29 existing PostgreSQL cap checks, 18 rename PostgreSQL checks, and 12 headless Edge browser checks. Tests run on isolated local PostgreSQL 17.6 with synthetic data; browser network responses are mocked.

Coverage includes anonymous RPC access, identity protection, exact booking-field preservation, limits/counters, historical weeks, unbooking, duplicate and orphan destinations, stale saves, transactional rollback after an injected audit failure, overlapping writes, rename chains, Unicode/case-only names, missing migration, error-state cache preservation, and UI reporting refresh.

Production read-only verification after installation: **60 brokers, 1,976 bookings, five limits, usage total 1,976, zero reconciliation mismatches**. Roster and limit digests were identical before/after installation; weekly enforcement remained on at revision 4. There were no rename-context or retired-name rows. Supabase security advisors returned no findings. Existing performance advice concerned two unused event indexes, unrelated to this change; see [Supabase's unused-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Run `supabase/verify-broker-renames.sql` for repeatable read-only checks. Do not run test fixtures against production.

## Operational rollback

If the new UI needs to be withdrawn, restore the previous browser files to reinstate the rename warning. Leave the database support and retired-name protection installed, especially once real renames have occurred. Do not drop accounting tables, delete aliases, disable triggers, or reverse a rename with independent table updates. A semantic reversal to a retired name requires a reviewed transactional procedure.
