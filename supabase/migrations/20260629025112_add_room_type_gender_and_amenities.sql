create type public.room_type_enum as enum (
  'room_2',
  'room_4',
  'room_6',
  'room_8'
);

create type public.room_gender_enum as enum (
  'male',
  'female'
);

alter table public.rooms
add column if not exists room_gender public.room_gender_enum not null default 'male';

update public.rooms
set room_type = case
  when capacity = 2 then 'room_2'
  when capacity = 4 then 'room_4'
  when capacity = 6 then 'room_6'
  when capacity = 8 then 'room_8'
  else 'room_4'
end;

alter table public.rooms
alter column room_type drop default;

alter table public.rooms
alter column room_type type public.room_type_enum
using room_type::public.room_type_enum;

alter table public.rooms
alter column room_type set default 'room_4';

create table public.amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.room_type_amenities (
  room_type public.room_type_enum not null,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (room_type, amenity_id)
);

insert into public.amenities (name)
values
  ('Giường đơn'),
  ('Giường tầng'),
  ('Bàn học'),
  ('Quạt'),
  ('Điều hoà'),
  ('Nhà vệ sinh riêng'),
  ('Tủ đồ cá nhân'),
  ('Chăn'),
  ('Gối'),
  ('Tủ lạnh'),
  ('Cửa sổ'),
  ('Tivi')
on conflict (name) do nothing;