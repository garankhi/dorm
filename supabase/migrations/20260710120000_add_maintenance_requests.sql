create table if not exists public.maintenances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.app_users(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  assigned_admin_id uuid references public.app_users(id) on delete set null,
  issue_type text not null check (issue_type in ('electrical', 'water', 'internet', 'cleaning', 'furniture', 'security', 'other')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'submitted' check (status in ('submitted', 'triaged', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened')),
  description text not null,
  internal_note text,
  rejection_reason text,
  room_under_maintenance boolean not null default false,
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_attachments (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.maintenances(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  uploaded_by_user_id uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint maintenance_attachments_path_unique unique (maintenance_id, storage_path)
);

create table if not exists public.maintenance_histories (
  id uuid primary key default gen_random_uuid(),
  maintenance_id uuid not null references public.maintenances(id) on delete cascade,
  actor_role text not null check (actor_role in ('student', 'admin', 'system')),
  actor_user_id uuid references public.app_users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists maintenances_status_idx on public.maintenances (status, submitted_at desc);
create index if not exists maintenances_student_idx on public.maintenances (student_id, status);
create index if not exists maintenances_room_idx on public.maintenances (room_id);
create index if not exists maintenance_attachments_maintenance_idx on public.maintenance_attachments (maintenance_id);
create index if not exists maintenance_histories_maintenance_idx on public.maintenance_histories (maintenance_id, created_at desc);

create trigger maintenances_set_updated_at
before update on public.maintenances
for each row execute function public.set_updated_at();
