-- ============================================================
-- Delivery Lifecycle — Phase 1 Migration
-- Adds notifications, messages, event_templates, qa_items,
-- logistics_entries tables and template_id to events.
-- ============================================================

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  link text,
  created_at timestamptz default now()
);

create index idx_notifications_user on notifications(user_id);
create index idx_notifications_event on notifications(event_id);
create index idx_notifications_is_read on notifications(user_id, is_read);

alter table notifications enable row level security;

create policy "Users see own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Internal users see all notifications"
  on notifications for select
  using (is_internal_user());

create policy "Internal users manage notifications"
  on notifications for all
  using (is_internal_user());

create policy "System can insert notifications"
  on notifications for insert
  with check (auth.uid() is not null);

create policy "Users can mark own notifications read"
  on notifications for update
  using (user_id = auth.uid());

-- ============================================================
-- MESSAGES
-- ============================================================

create table messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null,
  attachments jsonb default '[]',
  is_internal boolean not null default false,
  created_at timestamptz default now()
);

create index idx_messages_event on messages(event_id);
create index idx_messages_sender on messages(sender_id);

alter table messages enable row level security;

create policy "Customers see non-internal messages for own events"
  on messages for select
  using (
    is_internal = false
    and event_id in (select id from events where account_id = user_account_id())
  );

create policy "Internal users see all messages"
  on messages for select
  using (is_internal_user());

create policy "Customers can send messages on own events"
  on messages for insert
  with check (
    is_internal = false
    and event_id in (select id from events where account_id = user_account_id())
  );

create policy "Internal users manage messages"
  on messages for all
  using (is_internal_user());

-- ============================================================
-- EVENT TEMPLATES (internal only)
-- ============================================================

create table event_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  event_type event_type not null,
  package_type package_type not null,
  machine_type text,
  milestones_json jsonb not null default '[]',
  tasks_json jsonb not null default '[]',
  assets_json jsonb not null default '[]',
  qa_items_json jsonb not null default '[]',
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_event_templates_type on event_templates(event_type, package_type);
create index idx_event_templates_active on event_templates(is_active);

alter table event_templates enable row level security;

create policy "Internal users see templates"
  on event_templates for select
  using (is_internal_user());

create policy "Internal users manage templates"
  on event_templates for all
  using (is_internal_user());

create trigger set_updated_at before update on event_templates
  for each row execute function update_updated_at();

-- ============================================================
-- ALTER EVENTS — add template reference
-- (must come after event_templates is created)
-- ============================================================

alter table events
  add column template_id uuid references event_templates(id);

-- ============================================================
-- QA ITEMS
-- ============================================================

create table qa_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  status text not null default 'pending',
  tested_by uuid references profiles(id),
  tested_at timestamptz,
  failure_reason text,
  fix_description text,
  fixed_by uuid references profiles(id),
  fixed_at timestamptz,
  evidence_url text,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_qa_items_event on qa_items(event_id);
create index idx_qa_items_status on qa_items(status);
create index idx_qa_items_category on qa_items(category);

alter table qa_items enable row level security;

create policy "Customers see own event QA items"
  on qa_items for select
  using (
    event_id in (select id from events where account_id = user_account_id())
  );

create policy "Internal users see all QA items"
  on qa_items for select
  using (is_internal_user());

create policy "Internal users manage QA items"
  on qa_items for all
  using (is_internal_user());

create trigger set_updated_at before update on qa_items
  for each row execute function update_updated_at();

-- ============================================================
-- LOGISTICS ENTRIES
-- ============================================================

create table logistics_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  entry_type text not null,
  title text not null,
  description text,
  scheduled_date date,
  scheduled_time text,
  status text not null default 'pending',
  contact_name text,
  contact_phone text,
  tracking_reference text,
  notes text,
  completed_at timestamptz,
  completed_by uuid references profiles(id),
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_logistics_event on logistics_entries(event_id);
create index idx_logistics_status on logistics_entries(status);
create index idx_logistics_date on logistics_entries(scheduled_date);

alter table logistics_entries enable row level security;

create policy "Customers see own event logistics"
  on logistics_entries for select
  using (
    event_id in (select id from events where account_id = user_account_id())
  );

create policy "Internal users see all logistics"
  on logistics_entries for select
  using (is_internal_user());

create policy "Internal users manage logistics"
  on logistics_entries for all
  using (is_internal_user());

create trigger set_updated_at before update on logistics_entries
  for each row execute function update_updated_at();
