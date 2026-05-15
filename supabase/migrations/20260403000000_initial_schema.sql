-- ============================================================
-- Bright.Experience — Database Schema
-- ============================================================

-- Uses gen_random_uuid() which is built into Postgres 13+

-- ============================================================
-- ENUMS
-- ============================================================

create type event_stage as enum (
  'confirmed',
  'kickoff_complete',
  'creative_assets',
  'approvals',
  'build_configuration',
  'qa_readiness',
  'logistics_confirmed',
  'event_live',
  'reporting',
  'complete'
);

create type health_status as enum ('green', 'amber', 'red');

create type event_type as enum ('activation', 'sampling', 'vending', 'hybrid', 'custom');

create type package_type as enum ('standard', 'premium', 'custom');

create type user_role as enum (
  'customer_user',
  'customer_admin',
  'events_lead',
  'creative_lead',
  'operations_lead',
  'qa_lead',
  'developer',
  'admin'
);

create type task_status as enum ('pending', 'in_progress', 'complete', 'blocked', 'skipped');

create type task_type as enum ('customer_action', 'internal_action');

create type task_category as enum ('creative', 'operations', 'qa', 'development', 'logistics', 'reporting', 'admin');

create type task_priority as enum ('low', 'medium', 'high', 'critical');

create type milestone_status as enum ('pending', 'in_progress', 'complete', 'skipped');

create type asset_status as enum ('required', 'uploaded', 'under_review', 'accepted', 'rejected');

create type approval_status as enum ('pending', 'approved', 'rejected', 'revision_requested');

create type studio_request_status as enum ('draft', 'submitted', 'quoted', 'approved', 'in_progress', 'delivered', 'cancelled');

create type studio_service_type as enum ('design', 'animation', 'video', 'photography', 'copywriting', 'other');

-- ============================================================
-- CORE TABLES
-- ============================================================

create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  role user_role not null default 'customer_user',
  account_id uuid references accounts(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  name text not null,
  event_type event_type not null,
  package_type package_type not null default 'standard',
  machine_type text,
  venue_name text,
  venue_address text,
  event_date_start date not null,
  event_date_end date,
  setup_date date,
  collection_date date,
  current_stage event_stage not null default 'confirmed',
  health_status health_status not null default 'green',
  health_override boolean default false,
  health_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  stage event_stage not null,
  status milestone_status not null default 'pending',
  target_date date,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  sort_order integer not null default 0,
  customer_visible boolean default true,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  milestone_id uuid references milestones(id),
  title text not null,
  description text,
  task_type task_type not null,
  category task_category not null,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  assigned_to uuid references profiles(id),
  due_date date,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  is_blocking boolean default false,
  customer_visible boolean default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- STAGE 2 TABLES
-- ============================================================

create table assets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  task_id uuid references tasks(id),
  name text not null,
  description text,
  asset_type text not null,
  required_format text,
  required_dimensions text,
  file_url text,
  file_name text,
  file_size bigint,
  file_type text,
  version integer not null default 1,
  status asset_status not null default 'required',
  review_feedback text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  uploaded_by uuid references profiles(id),
  due_date date,
  customer_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  description text,
  approval_type text not null,
  status approval_status not null default 'pending',
  preview_url text,
  preview_assets uuid[],
  requested_by uuid references profiles(id),
  requested_at timestamptz default now(),
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  feedback text,
  revision_count integer not null default 0,
  customer_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table studio_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  service_type studio_service_type not null,
  title text not null,
  description text,
  reference_assets uuid[],
  estimated_cost numeric(10,2),
  estimated_days integer,
  status studio_request_status not null default 'draft',
  quoted_cost numeric(10,2),
  quoted_days integer,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  delivered_at timestamptz,
  customer_visible boolean default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table briefing_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  form_type text not null,
  responses jsonb not null default '{}',
  is_submitted boolean default false,
  submitted_by uuid references profiles(id),
  submitted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, form_type)
);

create table audit_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_events_account on events(account_id);
create index idx_events_stage on events(current_stage);
create index idx_events_health on events(health_status);
create index idx_milestones_event on milestones(event_id);
create index idx_tasks_event on tasks(event_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_tasks_status on tasks(status);
create index idx_assets_event on assets(event_id);
create index idx_assets_status on assets(status);
create index idx_approvals_event on approvals(event_id);
create index idx_approvals_status on approvals(status);
create index idx_studio_event on studio_requests(event_id);
create index idx_briefing_event on briefing_responses(event_id);
create index idx_audit_event on audit_entries(event_id);
create index idx_audit_entity on audit_entries(entity_type, entity_id);
create index idx_profiles_account on profiles(account_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table accounts enable row level security;
alter table profiles enable row level security;
alter table events enable row level security;
alter table milestones enable row level security;
alter table tasks enable row level security;
alter table assets enable row level security;
alter table approvals enable row level security;
alter table studio_requests enable row level security;
alter table briefing_responses enable row level security;
alter table audit_entries enable row level security;

-- Helper: check if user is internal (non-customer role)
create or replace function is_internal_user()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('events_lead', 'creative_lead', 'operations_lead', 'qa_lead', 'developer', 'admin')
  );
$$ language sql security definer stable;

-- Helper: get user's account_id
create or replace function user_account_id()
returns uuid as $$
  select account_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Profiles: users see own profile, internal users see all
create policy "Users can view own profile"
  on profiles for select using (id = auth.uid());
create policy "Internal users can view all profiles"
  on profiles for select using (is_internal_user());

-- Accounts: users see own account, internal see all
create policy "Users see own account"
  on accounts for select using (id = user_account_id());
create policy "Internal users see all accounts"
  on accounts for select using (is_internal_user());

-- Events: customers see own account events, internal see all
create policy "Customers see own events"
  on events for select using (account_id = user_account_id());
create policy "Internal users see all events"
  on events for select using (is_internal_user());
create policy "Internal users can update events"
  on events for update using (is_internal_user());
create policy "Internal users can insert events"
  on events for insert with check (is_internal_user());

-- Milestones: same as events
create policy "Customers see own milestones"
  on milestones for select using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all milestones"
  on milestones for select using (is_internal_user());
create policy "Internal manage milestones"
  on milestones for all using (is_internal_user());

-- Tasks: customers see customer_visible tasks for own events
create policy "Customers see own visible tasks"
  on tasks for select using (
    customer_visible = true
    and event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all tasks"
  on tasks for select using (is_internal_user());
create policy "Internal manage tasks"
  on tasks for all using (is_internal_user());
create policy "Customers can update own tasks"
  on tasks for update using (
    customer_visible = true
    and assigned_to = auth.uid()
    and event_id in (select id from events where account_id = user_account_id())
  );

-- Assets: customers see customer_visible assets, internal see all
create policy "Customers see own assets"
  on assets for select using (
    customer_visible = true
    and event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all assets"
  on assets for select using (is_internal_user());
create policy "Customers can upload assets"
  on assets for update using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal manage assets"
  on assets for all using (is_internal_user());

-- Approvals: customers see own, can update (approve/reject)
create policy "Customers see own approvals"
  on approvals for select using (
    customer_visible = true
    and event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all approvals"
  on approvals for select using (is_internal_user());
create policy "Customers can decide approvals"
  on approvals for update using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal manage approvals"
  on approvals for all using (is_internal_user());

-- Studio requests
create policy "Customers see own studio requests"
  on studio_requests for select using (
    customer_visible = true
    and event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all studio requests"
  on studio_requests for select using (is_internal_user());
create policy "Customers can create studio requests"
  on studio_requests for insert with check (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Customers can update own studio requests"
  on studio_requests for update using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal manage studio requests"
  on studio_requests for all using (is_internal_user());

-- Briefing responses
create policy "Customers see own briefings"
  on briefing_responses for select using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal see all briefings"
  on briefing_responses for select using (is_internal_user());
create policy "Customers can manage own briefings"
  on briefing_responses for all using (
    event_id in (select id from events where account_id = user_account_id())
  );
create policy "Internal manage briefings"
  on briefing_responses for all using (is_internal_user());

-- Audit entries: internal only
create policy "Internal see audit"
  on audit_entries for select using (is_internal_user());
create policy "Any authenticated user can create audit"
  on audit_entries for insert with check (auth.uid() is not null);

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public)
values ('event-assets', 'event-assets', false)
on conflict do nothing;

create policy "Authenticated users can upload assets"
  on storage.objects for insert
  with check (bucket_id = 'event-assets' and auth.uid() is not null);

create policy "Users can view event assets"
  on storage.objects for select
  using (bucket_id = 'event-assets' and auth.uid() is not null);

create policy "Internal users can delete assets"
  on storage.objects for delete
  using (bucket_id = 'event-assets' and is_internal_user());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on accounts
  for each row execute function update_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger set_updated_at before update on events
  for each row execute function update_updated_at();
create trigger set_updated_at before update on tasks
  for each row execute function update_updated_at();
create trigger set_updated_at before update on assets
  for each row execute function update_updated_at();
create trigger set_updated_at before update on approvals
  for each row execute function update_updated_at();
create trigger set_updated_at before update on studio_requests
  for each row execute function update_updated_at();
create trigger set_updated_at before update on briefing_responses
  for each row execute function update_updated_at();
