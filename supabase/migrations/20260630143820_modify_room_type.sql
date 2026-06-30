CREATE TYPE public.room_type_enum_new AS ENUM (
  'standard',
  'premium',
  'deluxe'
);

ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS room_gender public.room_gender_enum NOT NULL DEFAULT 'male';

ALTER TABLE public.rooms ALTER COLUMN room_type DROP DEFAULT;

ALTER TABLE public.rooms
ALTER COLUMN room_type TYPE public.room_type_enum_new
USING (
  CASE room_type::text
    WHEN 'room_2' THEN 'deluxe'
    WHEN 'room_4' THEN 'premium'
    WHEN 'room_6' THEN 'standard'
    WHEN 'room_8' THEN 'standard'
    ELSE 'standard'
  END
)::public.room_type_enum_new;

ALTER TABLE public.room_type_amenities ALTER COLUMN room_type DROP DEFAULT;

ALTER TABLE public.room_type_amenities
ALTER COLUMN room_type TYPE public.room_type_enum_new
USING (
  CASE room_type::text
    WHEN 'room_2' THEN 'deluxe'
    WHEN 'room_4' THEN 'premium'
    WHEN 'room_6' THEN 'standard'
    WHEN 'room_8' THEN 'standard'
    ELSE 'standard'
  END
)::public.room_type_enum_new;

DROP TYPE IF EXISTS public.room_type_enum;

ALTER TYPE public.room_type_enum_new RENAME TO room_type_enum;

ALTER TABLE public.rooms 
ALTER COLUMN room_type SET DEFAULT 'standard'::public.room_type_enum;