insert into public.rooms (
  building_name,
  room_number,
  floor,
  room_type,
  room_gender,
  capacity,
  current_occupancy,
  price_per_month,
  status,
  description
) values
  ('C', '501', 5, 'standard', 'male', 8, 0, 5000, 'available', 'Phong nam gia re 5.000 VND/thang'),
  ('C', '502', 5, 'standard', 'male', 8, 0, 6000, 'available', 'Phong nam gia re 6.000 VND/thang'),
  ('C', '503', 5, 'standard', 'male', 6, 0, 7000, 'available', 'Phong nam gia re 7.000 VND/thang'),
  ('C', '504', 5, 'standard', 'male', 6, 0, 8000, 'available', 'Phong nam gia re 8.000 VND/thang'),
  ('C', '505', 5, 'standard', 'male', 4, 0, 9000, 'available', 'Phong nam gia re 9.000 VND/thang'),
  ('C', '506', 5, 'standard', 'male', 4, 0, 10000, 'available', 'Phong nam gia re 10.000 VND/thang')
on conflict (building_name, room_number) do nothing;
