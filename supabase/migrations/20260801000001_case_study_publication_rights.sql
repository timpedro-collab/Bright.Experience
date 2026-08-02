-- Publication rights per case study: which level of public attribution the
-- client has approved. 'named' = full attribution; 'anonymised' = shown
-- without client name/quote attribution; 'aggregate_only' = never rendered
-- individually on public surfaces (its numbers may only feed aggregates).
alter table case_studies
  add column if not exists publication_rights text not null default 'named'
    check (publication_rights in ('named', 'anonymised', 'aggregate_only')),
  add column if not exists anonymised_label text;

comment on column case_studies.publication_rights is
  'Client-approved publication level for public marketing surfaces.';
comment on column case_studies.anonymised_label is
  'Descriptor shown instead of client_name when publication_rights = anonymised, e.g. ''A global coffee chain''.';
