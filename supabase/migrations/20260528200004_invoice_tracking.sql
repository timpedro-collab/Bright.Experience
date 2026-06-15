-- Workstream 4: Invoice and Payment Tracking
-- New tables for invoice management and per-account payment preferences.

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  invoice_number text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'GBP',
  payment_method text not null default 'invoice' check (payment_method in (
    'invoice', 'po', 'deposit_plus_invoice'
  )),
  po_number text,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  payment_reference text,
  status text not null default 'draft' check (status in (
    'draft', 'issued', 'overdue', 'paid', 'disputed', 'written_off'
  )),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_event on invoices(event_id);
create index idx_invoices_account on invoices(account_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_due_at on invoices(due_at) where status = 'issued';

create table if not exists account_payment_preferences (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade unique,
  preferred_method text not null default 'invoice' check (preferred_method in (
    'invoice', 'po'
  )),
  payment_terms_days integer not null default 30,
  finance_contact_name text,
  finance_contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
