alter table public.invoices
add column payment_code text unique;

alter table public.payments
add column provider text,
add column provider_transaction_id text unique,
add column provider_reference_code text,
add column provider_payload jsonb;