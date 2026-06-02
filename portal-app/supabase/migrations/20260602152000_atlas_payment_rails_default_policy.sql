-- Atlas payment rails default policy alignment
-- Purpose:
-- 1) Disable external manual rails by default across all workspaces
-- 2) Keep manual rails opt-in and explicitly configured

update atlas_workspace_payment_settings
set
  allow_zelle = false,
  allow_venmo = false,
  allow_cash_app = false,
  updated_at = now()
where
  coalesce(zelle_handle, '') = ''
  and coalesce(venmo_handle, '') = ''
  and coalesce(cash_app_handle, '') = ''
  and (allow_zelle = true or allow_venmo = true or allow_cash_app = true);
