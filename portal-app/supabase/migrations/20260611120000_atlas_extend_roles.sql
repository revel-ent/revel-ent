-- Extend app_role enum to cover all roles the portal uses.
-- production, dj_mc, and decorator are referenced in lib/auth.ts ROLES
-- and in ClientContactsPanel CONTACT_LABELS but were missing from the DB enum.
alter type app_role add value if not exists 'production';
alter type app_role add value if not exists 'dj_mc';
alter type app_role add value if not exists 'decorator';
