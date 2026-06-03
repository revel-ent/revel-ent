create table if not exists public.atlas_operational_state (
  event_id uuid primary key references public.events(event_id) on delete cascade,
  risk_overrides jsonb not null default '{}'::jsonb,
  equipment_overrides jsonb not null default '{}'::jsonb,
  cue_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists atlas_operational_state_updated_at_idx on public.atlas_operational_state(updated_at desc);

create or replace function public.touch_atlas_operational_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists touch_atlas_operational_state_updated_at on public.atlas_operational_state;
create trigger touch_atlas_operational_state_updated_at
before update on public.atlas_operational_state
for each row execute function public.touch_atlas_operational_state_updated_at();
