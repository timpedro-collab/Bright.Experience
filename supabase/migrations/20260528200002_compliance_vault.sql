-- Workstream 1: Compliance Document Vault
-- Tracks insurance certificates, DPA agreements, RAMS documentation, and
-- other compliance requirements per-event with expiry monitoring.

create table if not exists compliance_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  document_type text not null check (document_type in (
    'insurance_pl', 'insurance_el', 'insurance_product',
    'dpa', 'rams', 'h_and_s', 'contract', 'certificate', 'other'
  )),
  title text not null,
  file_url text,
  required_minimum text,
  current_value text,
  meets_requirement boolean default false,
  expires_at date,
  status text not null default 'required' check (status in (
    'required', 'uploaded', 'under_review', 'approved', 'expired', 'rejected'
  )),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  notes text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_compliance_documents_event on compliance_documents(event_id);
create index idx_compliance_documents_expires on compliance_documents(expires_at)
  where expires_at is not null;

-- Per-account compliance profile — set once, auto-populates for future events
create table if not exists client_compliance_requirements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  document_type text not null check (document_type in (
    'insurance_pl', 'insurance_el', 'insurance_product',
    'dpa', 'rams', 'h_and_s', 'contract', 'certificate', 'other'
  )),
  minimum_value text,
  is_mandatory boolean default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, document_type)
);

create index idx_client_compliance_account on client_compliance_requirements(account_id);
