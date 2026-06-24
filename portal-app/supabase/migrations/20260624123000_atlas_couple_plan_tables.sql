-- Data-driven couple plans: move client milestones, planning todos, and upgrades out of the
-- in-code constant (lib/mock-client-milestones.ts) and into event-scoped tables. The in-code plan
-- remains as a fallback/seed source. Accessed via the service-role admin client behind
-- requireEventRoleContext gating, consistent with atlas_couple_workspace_state (no RLS).

create table if not exists public.event_client_plans (
  event_id uuid primary key references public.events(event_id) on delete cascade,
  contract_signed_date date,
  primary_dates jsonb not null default '[]'::jsonb,
  venue_name text,
  estimated_guests integer,
  total_contract_value numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.event_payment_milestones (
  event_id uuid not null references public.events(event_id) on delete cascade,
  id text not null,
  label text not null,
  amount numeric(12, 2) not null default 0,
  percent integer not null default 0,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'overdue', 'not_applicable')),
  completed_at date,
  note text,
  client_completable boolean not null default false,
  sort_order integer not null default 0,
  primary key (event_id, id)
);

create table if not exists public.event_planning_todos (
  event_id uuid not null references public.events(event_id) on delete cascade,
  id text not null,
  category text not null default 'planning' check (category in ('payment', 'planning', 'document', 'upgrade')),
  title text not null,
  detail text not null default '',
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'completed', 'overdue', 'not_applicable')),
  completed_at date,
  client_completable boolean not null default false,
  badge_label text,
  sort_order integer not null default 0,
  primary key (event_id, id)
);

create table if not exists public.event_upgrades (
  event_id uuid not null references public.events(event_id) on delete cascade,
  id text not null,
  title text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  unit text not null default 'flat',
  category text not null default 'General',
  popular boolean not null default false,
  sort_order integer not null default 0,
  primary key (event_id, id)
);

create or replace function public.touch_event_client_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists touch_event_client_plans_updated_at on public.event_client_plans;
create trigger touch_event_client_plans_updated_at
before update on public.event_client_plans
for each row execute function public.touch_event_client_plans_updated_at();

-- ── Seed: Akshay & Rani Patel (Nov 27-28 2026, Crowne Plaza Peachtree City) ──────────────────
-- Guarded by event existence: this event is created via the live onboarding/invite flow, not a
-- migration, so the seed only applies where the event row is present (e.g. production).
do $$
begin
  if exists (select 1 from public.events where event_id = 'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0') then
    insert into public.event_client_plans (event_id, contract_signed_date, primary_dates, venue_name, estimated_guests, total_contract_value)
    values ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', '2026-05-15', '["2026-11-27","2026-11-28"]'::jsonb, 'Crowne Plaza Peachtree City', 300, 17700)
    on conflict (event_id) do nothing;

    insert into public.event_payment_milestones (event_id, id, label, amount, percent, due_date, status, completed_at, note, client_completable, sort_order) values
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'pay-deposit', '30% Booking Deposit', 5310, 30, '2026-05-15', 'completed', '2026-06-07', 'Received June 7, 2026 via PayPal credit card. Thank you!', true, 0),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'pay-final', 'Remaining Balance', 12390, 70, '2026-11-13', 'pending', null, 'Due 14 days before your first event date. No changes to package after this milestone.', true, 1)
    on conflict (event_id, id) do nothing;

    insert into public.event_planning_todos (event_id, id, category, title, detail, due_date, status, completed_at, client_completable, badge_label, sort_order) values
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-contract', 'document', 'Signed Contract on File', 'Your agreement is signed and recorded. No action needed.', null, 'completed', '2026-05-15', false, 'Done', 0),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-music-questionnaire', 'planning', 'Complete Music Questionnaire (First Step After Deposit)', 'Please submit your dance-floor music preferences within 7 days of your 30% deposit confirmation. Include approximate percentage split by genre: Bhangra (newer), Bhangra (old school), Bollywood (newer), Bollywood (older), old school hip-hop, current hip-hop/Top 40 hits, house, Latin, and other. Add any dance-off ideas plus additional notes about artists, genres, or transitions.', '2026-06-11', 'pending', null, true, 'Action Required', 1),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-intake', 'planning', 'Complete Vision & Preferences Intake', 'Share your cultural background, ceremony styles, music preferences, and any non-negotiables. This helps us personalize every detail.', '2026-06-15', 'pending', null, false, 'Action Required', 2),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-venue-walkthrough', 'planning', 'Schedule Venue Walk-Through', 'We recommend an in-person site visit at Crowne Plaza Peachtree City to review stage placement, décor constraints, and production flow.', '2026-07-31', 'pending', null, false, 'Upcoming', 3),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-guestlist', 'planning', 'Confirm Final Guest Count', 'Finalize your headcount within ±10%. This locks in catering estimates, seating charts, and audio zoning for the space.', '2026-09-15', 'pending', null, true, 'Upcoming', 4),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-music-brief', 'planning', 'Submit Music & Ceremony Cue Brief', 'After your questionnaire is complete, share ceremony songs, processional tracks, first dance, and any dhol/band preferences so we can finalize your production cue sheet.', '2026-10-01', 'pending', null, false, 'Upcoming', 5),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-vendor-approval', 'planning', 'Approve Recommended Vendor List', 'Review décor, photography, catering, and florals vendors REVEL has coordinated with for your venue. Approve or request alternatives.', '2026-08-15', 'pending', null, false, 'Upcoming', 6),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'todo-day-of-brief', 'planning', 'Review & Sign Off on Day-Of Timeline', 'Your personalized ceremony-to-reception run-of-show. We will send a draft 30 days before the event for your final approval.', '2026-10-28', 'pending', null, true, 'Upcoming', 7)
    on conflict (event_id, id) do nothing;

    insert into public.event_upgrades (event_id, id, title, description, price, unit, category, popular, sort_order) values
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'upg-photobooth', 'Premium Photo Booth Experience', 'Custom-branded photo booth with unlimited prints, digital sharing station, and a dedicated attendant for the full reception.', 1200, 'flat', 'Entertainment', true, 0),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'upg-monogram', 'Custom Gobo Monogram Lighting', 'Your names and wedding date projected as a monogram pattern on the dance floor or wall during reception.', 450, 'flat', 'Lighting', false, 1),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'upg-afterparty-dj', 'After-Party DJ Extension', 'Extend your DJ/MC package by 2 hours for a private after-party set with curated late-night energy.', 950, 'flat', 'Entertainment', true, 2),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'upg-uplighting', 'Enhanced Uplighting Package', 'Upgrade from standard to premium uplighting — 24 LED uplights in custom color palette matching your wedding palette.', 650, 'flat', 'Lighting', false, 3),
      ('b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0', 'upg-vip-concierge', 'VIP Day-of Concierge Coordinator', 'A dedicated REVEL coordinator on-site for both event days, handling guest logistics, vendor management, and real-time timeline execution.', 1500, 'flat', 'Coordination', false, 4)
    on conflict (event_id, id) do nothing;
  end if;
end $$;

-- ── Seed: Jayati & Uppal (May 23-24 2026, DoubleTree Atlanta Northlake) ───────────────────────
do $$
begin
  if exists (select 1 from public.events where event_id = '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11') then
    insert into public.event_client_plans (event_id, contract_signed_date, primary_dates, venue_name, estimated_guests, total_contract_value)
    values ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', '2026-02-14', '["2026-05-23","2026-05-24"]'::jsonb, 'DoubleTree Atlanta Northlake', 340, 24000)
    on conflict (event_id) do nothing;

    insert into public.event_payment_milestones (event_id, id, label, amount, percent, due_date, status, completed_at, note, client_completable, sort_order) values
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'pay-deposit-ja', '30% Booking Deposit', 7200, 30, '2026-02-21', 'completed', '2026-02-19', 'Wire received. Thank you!', true, 0),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'pay-mid-ja', '40% Mid-Event Payment', 9600, 40, '2026-08-22', 'pending', null, 'Due 90 days before your event. Wire or check accepted.', true, 1),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'pay-final-ja', '30% Final Balance', 7200, 30, '2026-11-07', 'pending', null, 'Due 14 days before your first event date.', true, 2)
    on conflict (event_id, id) do nothing;

    insert into public.event_planning_todos (event_id, id, category, title, detail, due_date, status, completed_at, client_completable, badge_label, sort_order) values
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'todo-contract-ja', 'document', 'Signed Contract on File', 'Agreement signed and recorded.', null, 'completed', '2026-02-14', false, 'Done', 0),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'todo-intake-ja', 'planning', 'Complete Vision & Preferences Intake', 'Share cultural background, ceremony styles, and music preferences.', '2026-03-15', 'completed', '2026-03-08', false, 'Done', 1),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'todo-guestlist-ja', 'planning', 'Confirm Final Guest Count', 'Finalize headcount within ±10% to lock catering estimates.', '2026-09-01', 'pending', null, true, 'Upcoming', 2),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'todo-music-brief-ja', 'planning', 'Submit Music & Ceremony Cue Brief', 'Ceremony songs, processional tracks, first dance, and dhol preferences.', '2026-09-15', 'pending', null, false, 'Upcoming', 3),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'todo-timeline-ja', 'planning', 'Review & Sign Off on Day-Of Timeline', 'Your run-of-show draft will be sent 30 days before the event.', '2026-10-22', 'pending', null, true, 'Upcoming', 4)
    on conflict (event_id, id) do nothing;

    insert into public.event_upgrades (event_id, id, title, description, price, unit, category, popular, sort_order) values
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'upg-photobooth-ja', 'Premium Photo Booth Experience', 'Custom-branded photo booth with unlimited prints and digital sharing.', 1200, 'flat', 'Entertainment', true, 0),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'upg-afterparty-ja', 'After-Party DJ Extension', 'Extend DJ/MC package by 2 hours for a private after-party set.', 950, 'flat', 'Entertainment', true, 1),
      ('0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11', 'upg-dhol-ja', 'Dhol Player — Baraat & Reception', 'Live dhol for Baraat procession and reception entrance.', 800, 'flat', 'Live Music', false, 2)
    on conflict (event_id, id) do nothing;
  end if;
end $$;
