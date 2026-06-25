-- Durable persistence for couple-facing workspace state (payments, planning todos, music questionnaire).
-- Mirrors the atlas_operational_state pattern (event-scoped JSONB overrides + merge RPC + updated_at trigger).
-- Access is exclusively through the Supabase service-role admin client behind requireEventRoleContext()
-- app-layer gating (admin/planner/couple), consistent with atlas_operational_state; no RLS policies here.
create table if not exists public.atlas_couple_workspace_state (
  event_id uuid primary key references public.events(event_id) on delete cascade,
  payment_overrides jsonb not null default '{}'::jsonb,
  todo_overrides jsonb not null default '{}'::jsonb,
  music_submission jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists atlas_couple_workspace_state_updated_at_idx
  on public.atlas_couple_workspace_state(updated_at desc);

create or replace function public.touch_atlas_couple_workspace_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists touch_atlas_couple_workspace_state_updated_at on public.atlas_couple_workspace_state;
create trigger touch_atlas_couple_workspace_state_updated_at
before update on public.atlas_couple_workspace_state
for each row execute function public.touch_atlas_couple_workspace_state_updated_at();

-- Merge a single override into one domain without clobbering the others.
-- p_domain in ('payment','todo'): merge p_override_value into the keyed map at p_override_key.
-- p_domain = 'music': replace the whole music_submission column with p_override_value (p_override_key ignored).
create or replace function public.atlas_couple_workspace_state_merge(
  p_event_id uuid,
  p_domain text,
  p_override_key text,
  p_override_value jsonb
)
returns void
language plpgsql
as $$
begin
  insert into public.atlas_couple_workspace_state (
    event_id,
    payment_overrides,
    todo_overrides,
    music_submission
  )
  values (
    p_event_id,
    case when p_domain = 'payment' then jsonb_build_object(p_override_key, p_override_value) else '{}'::jsonb end,
    case when p_domain = 'todo' then jsonb_build_object(p_override_key, p_override_value) else '{}'::jsonb end,
    case when p_domain = 'music' then p_override_value else null end
  )
  on conflict (event_id)
  do update
  set
    payment_overrides = case
      when p_domain = 'payment' then coalesce(public.atlas_couple_workspace_state.payment_overrides, '{}'::jsonb) || jsonb_build_object(p_override_key, p_override_value)
      else public.atlas_couple_workspace_state.payment_overrides
    end,
    todo_overrides = case
      when p_domain = 'todo' then coalesce(public.atlas_couple_workspace_state.todo_overrides, '{}'::jsonb) || jsonb_build_object(p_override_key, p_override_value)
      else public.atlas_couple_workspace_state.todo_overrides
    end,
    music_submission = case
      when p_domain = 'music' then p_override_value
      else public.atlas_couple_workspace_state.music_submission
    end;
end;
$$;
