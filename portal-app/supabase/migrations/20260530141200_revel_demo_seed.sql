-- REVEL demo seed for UUID-based mock login context.
-- Keeps portal login usable while allowing Supabase-backed live/timeline reads and updates.

insert into events (
  event_id,
  couple_primary_name,
  partner_name,
  event_label,
  city,
  state,
  guest_count_estimate,
  status,
  starts_on
)
values (
  '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
  'Jayati',
  'Akshay',
  'Jayati & Akshay Wedding Weekend',
  'Atlanta',
  'GA',
  340,
  'active',
  current_date
)
on conflict (event_id) do update
set
  event_label = excluded.event_label,
  guest_count_estimate = excluded.guest_count_estimate,
  status = excluded.status,
  updated_at = now();

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
    '6a4018ea-f6b8-4e53-8077-6ad6c572f0a1',
    '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    'load_in',
    'Vendor Load-In and Sound Check',
    now() - interval '45 minutes',
    now() - interval '15 minutes',
    'completed',
    true,
    true,
    '{"note":"Confirm power lanes, cable safety, and stage access before guests arrive."}'::jsonb,
    null,
    null
  ),
  (
    '0ddf357d-27ec-42e0-81ac-7384a3a973f5',
    '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    'baraat',
    'Baraat Assembly and Route Start',
    now() - interval '10 minutes',
    now() + interval '20 minutes',
    'in_progress',
    true,
    true,
    '{"note":"Assemble immediate family first; start processional route once DJ confirms sound lane."}'::jsonb,
    'Confirm procession route and staging access with venue contact before go-live.',
    null
  ),
  (
    '7ab3f7af-8a9a-4740-98eb-973aa19d5db1',
    '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    'ceremony',
    'Ceremony Seating and Start',
    now() + interval '30 minutes',
    now() + interval '90 minutes',
    'pending',
    true,
    true,
    '{"note":"Seat elderly guests first; keep aisle clear for couple entrance."}'::jsonb,
    null,
    null
  ),
  (
    'a53f6de7-cfd6-4ec5-a625-891b4fae8f4d',
    '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    'cocktail',
    'Cocktail Transition',
    now() + interval '100 minutes',
    now() + interval '145 minutes',
    'pending',
    true,
    true,
    '{"note":"Open beverage stations before transition announcement."}'::jsonb,
    null,
    null
  ),
  (
    '6f36fb76-84d0-4a13-bf38-138ab73e6112',
    '0f1d7d0a-7c8f-4f5f-9c89-9c8b2f3e1a11',
    'reception',
    'Reception Grand Entry',
    now() + interval '155 minutes',
    now() + interval '215 minutes',
    'pending',
    true,
    true,
    '{"note":"Lock final cue order 10 minutes before entry."}'::jsonb,
    null,
    null
  )
on conflict (timeline_id) do update
set
  title = excluded.title,
  scheduled_start = excluded.scheduled_start,
  scheduled_end = excluded.scheduled_end,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();
