alter table public.contracts
drop constraint if exists contracts_status_check;

alter table public.contracts
add constraint contracts_status_check
check (status in ('pending_payment', 'active', 'expired', 'terminated', 'cancelled'));

drop index if exists public.contracts_one_active_per_student;

create unique index contracts_one_open_per_student
  on public.contracts (student_id)
  where status in ('pending_payment', 'active');

create index if not exists contracts_room_status_idx
  on public.contracts (room_id, status);
