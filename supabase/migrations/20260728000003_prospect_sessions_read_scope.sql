-- ============================================================
-- prospect_sessions: remove the world-readable SELECT policy
-- ============================================================
--
-- "Public read own prospect session" was `using (true)`, which despite the name
-- let any caller — signed in or not — read every row: `contact_email` plus the
-- `session_token` that identifies the session. Anyone could enumerate prospect
-- emails and lift the tokens.
--
-- No application code reads or writes this table (the quoting funnel tracks
-- prospects on `quotes` itself), so there is nothing to keep working. Internal
-- read stays; the public INSERT stays so an anonymous funnel step can still
-- record a session if that flow is ever wired up. Should a public read-back be
-- needed later, it must match on the token, e.g.
--   using (session_token = current_setting('request.headers', true)::json ->> 'x-session-token')
-- rather than being unconditional.

drop policy if exists "Public read own prospect session" on prospect_sessions;
