-- REVEL intake + guest request durable persistence
-- Purpose:
-- 1) Store uploaded intake documents with audit metadata
-- 2) Store guest requests with actor/event context

insert into storage.buckets (id, name, public, file_size_limit)
values ('atlas-intake', 'atlas-intake', false, 20971520)
on conflict (id) do nothing;

create table if not exists intake_documents (
  intake_document_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  uploaded_by_user_id uuid not null,
  uploaded_by_email text not null,
  actor_role app_role not null,
  source text not null,
  domain text not null,
  original_filename text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint not null,
  extracted_signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_intake_documents_event_created on intake_documents (event_id, created_at desc);
create index if not exists idx_intake_documents_actor on intake_documents (uploaded_by_user_id, created_at desc);

create table if not exists guest_requests (
  guest_request_id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(event_id) on delete cascade,
  actor_user_id uuid not null,
  actor_email text not null,
  actor_role app_role not null,
  source text not null,
  request_type text not null,
  details text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (request_type in ('song', 'dietary')),
  check (status in ('queued', 'acknowledged', 'completed', 'dismissed'))
);

create index if not exists idx_guest_requests_event_created on guest_requests (event_id, created_at desc);
create index if not exists idx_guest_requests_actor on guest_requests (actor_user_id, created_at desc);
