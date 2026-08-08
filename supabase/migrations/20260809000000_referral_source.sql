-- Self-reported discovery channel from proposal intake (loop measurement).

alter table public.quotes add column if not exists referral_source text;

comment on column public.quotes.referral_source is
  'Buyer self-reported discovery channel from intake ("How did you hear about us?"); used for referral-loop measurement.';
