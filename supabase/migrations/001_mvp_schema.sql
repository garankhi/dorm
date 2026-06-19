-- SDMS MVP schema for Supabase PostgreSQL used through .NET EF Core.
-- Architecture: Frontend -> .NET Web API -> EF Core -> Supabase PostgreSQL.
-- The frontend must not call Supabase directly.
-- This SQL is a bootstrap/reference script. After the .NET project is created,
-- EF Core migrations should become the main source of truth.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  phone_number text,
  role text not null check (role in ('admin', 'student')),
  status text not null default 'active' check (status in ('active', 'locked', 'inactive')),
  student_code text unique,
  gender text check (gender is null or gender in ('male', 'female', 'other')),
  date_of_birth date,
  faculty text,
  class_name text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_student_fields_check check (
    role = 'student' or student_code is null
  )
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  building_name text not null,
  room_number text not null,
  floor integer not null default 1,
  room_type text not null default 'standard',
  capacity integer not null check (capacity > 0),
  current_occupancy integer not null default 0,
  price_per_month numeric(12, 2) not null check (price_per_month >= 0),
  status text not null default 'available' check (status in ('available', 'full', 'maintenance', 'inactive')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_occupancy_capacity_check check (current_occupancy >= 0 and current_occupancy <= capacity),
  constraint rooms_building_room_unique unique (building_name, room_number)
);

create table public.dorm_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.app_users(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.app_users(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  application_id uuid not null unique references public.dorm_applications(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  monthly_price numeric(12, 2) not null check (monthly_price >= 0),
  deposit_amount numeric(12, 2) not null default 0 check (deposit_amount >= 0),
  status text not null default 'active' check (status in ('active', 'expired', 'terminated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  terminated_at timestamptz,
  termination_reason text,
  constraint contracts_date_check check (end_date > start_date)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.app_users(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  invoice_code text not null unique,
  billing_month integer not null check (billing_month between 1 and 12),
  billing_year integer not null check (billing_year between 2020 and 2100),
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'pending_confirmation', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete restrict,
  student_id uuid not null references public.app_users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank_transfer', 'online')),
  proof_url text,
  status text not null default 'pending_confirmation' check (status in ('pending_confirmation', 'confirmed', 'rejected')),
  paid_at timestamptz not null default now(),
  confirmed_at timestamptz,
  confirmed_by_user_id uuid references public.app_users(id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index dorm_applications_one_pending_per_student
  on public.dorm_applications (student_id)
  where status = 'pending';

create unique index contracts_one_active_per_student
  on public.contracts (student_id)
  where status = 'active';

create index app_users_role_status_idx on public.app_users (role, status);
create index rooms_status_capacity_idx on public.rooms (status, current_occupancy, capacity);
create index dorm_applications_status_submitted_idx on public.dorm_applications (status, submitted_at desc);
create index dorm_applications_student_idx on public.dorm_applications (student_id, submitted_at desc);
create index contracts_student_status_idx on public.contracts (student_id, status);
create index invoices_student_status_idx on public.invoices (student_id, status, created_at desc);
create index invoices_contract_idx on public.invoices (contract_id);
create index payments_invoice_status_idx on public.payments (invoice_id, status);

create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create trigger rooms_set_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

create trigger dorm_applications_set_updated_at
before update on public.dorm_applications
for each row execute function public.set_updated_at();

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Seed data for quick manual testing. Replace password_hash values from the API seeding code.
insert into public.app_users (
  email,
  password_hash,
  full_name,
  phone_number,
  role,
  status,
  student_code,
  gender,
  faculty,
  class_name
) values
  ('admin@sdms.local', 'replace-with-bcrypt-hash', 'Admin Demo', null, 'admin', 'active', null, null, null, null),
  ('student@sdms.local', 'replace-with-bcrypt-hash', 'Student Demo', '0900000000', 'student', 'active', 'SV001', 'male', 'Information Technology', 'IT01')
on conflict (email) do nothing;

insert into public.rooms (
  building_name,
  room_number,
  floor,
  room_type,
  capacity,
  current_occupancy,
  price_per_month,
  status,
  description
) values
  ('A', '101', 1, 'standard', 4, 0, 750000, 'available', 'Phong 4 nguoi, gan cong chinh'),
  ('A', '102', 1, 'standard', 4, 2, 750000, 'available', 'Phong 4 nguoi'),
  ('B', '201', 2, 'premium', 2, 0, 1200000, 'available', 'Phong 2 nguoi'),
  ('B', '202', 2, 'standard', 4, 4, 750000, 'full', 'Phong da day')
on conflict (building_name, room_number) do nothing;
