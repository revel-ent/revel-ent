-- Coordination feed: planner/ops posts visible to the couple portal.
-- Written by the API layer (service role); no RLS required.

create table if not exists coordination_feed (
  id          uuid        primary key default gen_random_uuid(),
  event_id    uuid        not null references events(id) on delete cascade,
  author_name text        not null,
  author_role text        not null check (author_role in ('planner', 'ops', 'vendor', 'admin', 'couple')),
  message     text        not null,
  status      text        not null default 'pending'
                          check (status in ('pending', 'acknowledged', 'executed')),
  created_at  timestamptz not null default now()
);

create index if not exists coordination_feed_event_id_idx
  on coordination_feed (event_id, created_at desc);
