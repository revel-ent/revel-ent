create or replace function public.atlas_operational_state_merge_override(
  p_event_id uuid,
  p_domain text,
  p_override_key text,
  p_override_value jsonb
)
returns void
language plpgsql
as $$
begin
  insert into public.atlas_operational_state (
    event_id,
    risk_overrides,
    equipment_overrides,
    cue_overrides
  )
  values (
    p_event_id,
    case when p_domain = 'risk' then jsonb_build_object(p_override_key, p_override_value) else '{}'::jsonb end,
    case when p_domain = 'equipment' then jsonb_build_object(p_override_key, p_override_value) else '{}'::jsonb end,
    case when p_domain = 'cue' then jsonb_build_object(p_override_key, p_override_value) else '{}'::jsonb end
  )
  on conflict (event_id)
  do update
  set
    risk_overrides = case
      when p_domain = 'risk' then coalesce(public.atlas_operational_state.risk_overrides, '{}'::jsonb) || jsonb_build_object(p_override_key, p_override_value)
      else public.atlas_operational_state.risk_overrides
    end,
    equipment_overrides = case
      when p_domain = 'equipment' then coalesce(public.atlas_operational_state.equipment_overrides, '{}'::jsonb) || jsonb_build_object(p_override_key, p_override_value)
      else public.atlas_operational_state.equipment_overrides
    end,
    cue_overrides = case
      when p_domain = 'cue' then coalesce(public.atlas_operational_state.cue_overrides, '{}'::jsonb) || jsonb_build_object(p_override_key, p_override_value)
      else public.atlas_operational_state.cue_overrides
    end;
end;
$$;
