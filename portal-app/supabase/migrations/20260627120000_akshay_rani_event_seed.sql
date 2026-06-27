-- Seed Akshay & Rani wedding weekend (November 27–28, 2026) into Supabase.
-- Inherits organization_id from the existing Jayati-Uppal event so multi-tenancy stays aligned.
-- Timeline items use absolute timestamps for their actual event date.

insert into events (
  event_id,
  couple_primary_name,
  partner_name,
  event_label,
  city,
  state,
  guest_count_estimate,
  status,
  starts_on,
  ends_on,
  organization_id
)
select
  'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
  'Akshay',
  'Rani',
  'Akshay & Rani Wedding Weekend',
  'Peachtree City',
  'GA',
  300,
  'active',
  '2026-11-27',
  '2026-11-28',
  organization_id
from events
where event_id = '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11'
on conflict (event_id) do update
set
  event_label      = excluded.event_label,
  guest_count_estimate = excluded.guest_count_estimate,
  status           = excluded.status,
  starts_on        = excluded.starts_on,
  ends_on          = excluded.ends_on,
  updated_at       = now();

-- Day 1 (Nov 27): Garba / Sangeet night at Crowne Plaza Peachtree City
insert into timelines (
  timeline_id,
  event_id,
  phase_code,
  title,
  scheduled_start,
  scheduled_end,
  status,
  can_delegate_update,
  is_template_generated,
  atlas_prompt,
  escalation_hint,
  notes
)
values
  (
    'e1a00001-aaaa-4b00-8001-000000000001',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'load_in',
    'Vendor Load-In and Sound Check (Day 1)',
    '2026-11-27 19:00:00+00',
    '2026-11-27 20:00:00+00',
    'pending',
    true,
    true,
    '{"note":"Confirm power lanes, cable runs, and stage access before Garba guests arrive."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00002-aaaa-4b00-8002-000000000002',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'mehndi',
    'Garba / Sangeet Welcome and Floor Open',
    '2026-11-27 20:30:00+00',
    '2026-11-27 21:30:00+00',
    'pending',
    true,
    true,
    '{"note":"Open Garba floor after welcome remarks; DJ leads first circle."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00003-aaaa-4b00-8003-000000000003',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'mehndi',
    'Sangeet Program and Live Performances',
    '2026-11-27 21:30:00+00',
    '2026-11-27 22:30:00+00',
    'pending',
    true,
    true,
    '{"note":"Family and friend performances; coordinate mic handoffs with MC."}'::jsonb,
    'Confirm performance order and A/V cues with MC 30 min before program start.',
    null
  ),
  (
    'e1a00004-aaaa-4b00-8004-000000000004',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'mehndi',
    'Dinner Service and Open Dance Floor',
    '2026-11-27 22:30:00+00',
    '2026-11-28 01:00:00+00',
    'pending',
    true,
    true,
    '{"note":"Dinner buffet opens; DJ transitions to open dance floor after first 20 min of service."}'::jsonb,
    null,
    null
  ),
  -- Day 2 (Nov 28): Wedding ceremony and reception
  (
    'e1a00005-aaaa-4b00-8005-000000000005',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'load_in',
    'Vendor Load-In and Sound Check (Wedding Day)',
    '2026-11-28 13:00:00+00',
    '2026-11-28 14:30:00+00',
    'pending',
    true,
    true,
    '{"note":"All vendors on-site 2.5 hours before baraat; confirm power, lighting, and décor placement."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00006-aaaa-4b00-8006-000000000006',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'baraat',
    'Baraat Assembly and Route Start',
    '2026-11-28 16:00:00+00',
    '2026-11-28 16:45:00+00',
    'pending',
    true,
    true,
    '{"note":"Assemble immediate family first; start processional once DJ confirms sound lane clear."}'::jsonb,
    'Confirm procession route and guest safety lane with venue contact before go-live.',
    null
  ),
  (
    'e1a00007-aaaa-4b00-8007-000000000007',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'ceremony',
    'Ceremony Seating and Start',
    '2026-11-28 17:00:00+00',
    '2026-11-28 18:15:00+00',
    'pending',
    true,
    true,
    '{"note":"Seat elderly guests first; keep aisle clear for couple entrance."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00008-aaaa-4b00-8008-000000000008',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'cocktail',
    'Cocktail Hour',
    '2026-11-28 18:15:00+00',
    '2026-11-28 19:15:00+00',
    'pending',
    true,
    true,
    '{"note":"Open beverage stations before transition announcement; couple portraits during this window."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00009-aaaa-4b00-8009-000000000009',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'reception',
    'Reception Grand Entry and Program',
    '2026-11-28 19:30:00+00',
    '2026-11-28 21:30:00+00',
    'pending',
    true,
    true,
    '{"note":"Lock final cue order 10 minutes before grand entry; first dance, speeches, cake cut."}'::jsonb,
    null,
    null
  ),
  (
    'e1a00010-aaaa-4b00-8010-000000000010',
    'b3c9e1f2-4a7d-4e8b-a1c2-d5e6f7a8b9c0',
    'reception',
    'Dinner Service and Open Dancing',
    '2026-11-28 21:30:00+00',
    '2026-11-29 00:00:00+00',
    'pending',
    true,
    true,
    '{"note":"Dinner buffet service; DJ transitions to open dance floor after 20 min."}'::jsonb,
    null,
    null
  )
on conflict (timeline_id) do update
set
  title            = excluded.title,
  scheduled_start  = excluded.scheduled_start,
  scheduled_end    = excluded.scheduled_end,
  status           = excluded.status,
  notes            = excluded.notes,
  updated_at       = now();
