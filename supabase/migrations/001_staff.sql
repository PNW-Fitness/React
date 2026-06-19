-- ─────────────────────────────────────────────────────────────────────────────
-- 001_staff.sql  —  Staff schema, seed data, and RLS policies
--
-- Paste the entire contents of this file into the Supabase SQL editor and run
-- it in one shot. Safe to re-run: all objects use IF NOT EXISTS / INSERT …
-- ON CONFLICT DO NOTHING so re-running won't duplicate data.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  photo_url   TEXT,
  initial     CHAR(1)     NOT NULL,
  cert        TEXT,
  specialty   TEXT,
  bio         TEXT,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_roles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id       UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('personal_trainer', 'group_instructor')),
  display_order  INT  NOT NULL DEFAULT 0,
  classes_taught TEXT[],
  UNIQUE (staff_id, role)
);


-- ─── Seed data ───────────────────────────────────────────────────────────────
-- Values pulled directly from the existing JSX files. Do not add or invent
-- content here — edits should happen through the future admin dashboard.

INSERT INTO staff (name, photo_url, initial, cert, specialty, bio, tags)
VALUES
  (
    'Keith', 'coaches/Keith.jpg', 'K', 'NASM-CPT', 'Strength & Longevity',
    'Specializes in building long-term strength and sustainable fitness habits. Keith works with clients of all ages, including those returning to fitness later in life. His programming focuses on progressive overload, joint health, and building routines that stick for the long haul.',
    ARRAY['Strength', 'Longevity', 'Rehab']
  ),
  (
    'Dave', 'coaches/Dave.jpg', 'D', 'NASM-CPT', 'Functional Movement',
    'Focuses on movement quality and functional fitness. Dave helps clients move better, feel better, and perform better in everyday life. His sessions combine mobility work, corrective exercise, and sport-inspired training to build bodies that are both strong and resilient.',
    ARRAY['Functional', 'Mobility', 'Athletic']
  ),
  (
    'Joel', 'coaches/Joel.jpg', 'J', 'NASM-CSCS', 'Athletic Performance',
    'A Certified Strength and Conditioning Specialist with a background in competitive athletics. Joel builds sport-specific programs for competitive and recreational athletes focused on speed, power, and peak performance — and coaches the only boxing program in Capitol Hill.',
    ARRAY['Performance', 'Speed', 'Boxing']
  ),
  (
    'Bee', 'coaches/Bee.jpg', 'B', 'RYT-500, NASM', 'Yoga, Pilates & Barre',
    'Brings a holistic approach to movement through yoga, Pilates, and barre. With her RYT-500 certification and NASM credentials, Bee focuses on fascia health, body awareness, and recovery — helping members feel as good between sessions as they do during them.',
    ARRAY['Yoga', 'Pilates', 'Barre', 'Recovery']
  ),
  (
    'Prabh', 'coaches/Prabh.jpg', 'P', 'NASM-CNC', 'Nutrition & Conditioning',
    'A Certified Nutrition Coach who combines smart eating strategies with effective conditioning programs for total body transformation. Prabh runs our weekly Nutrition Workshop and coaches Spin, bringing the same data-driven mindset to both cardio and plate.',
    ARRAY['Nutrition', 'Conditioning', 'Spin']
  ),
  (
    'Marcus', 'coaches/Marcus.jpg', 'M', 'NASM-CPT', 'Boxing & Conditioning',
    NULL,
    ARRAY['Boxing', 'HIIT', 'Conditioning']
  ),
  (
    'Dana', 'coaches/Dana.jpg', 'D', 'Certified Spin Instructor', 'Indoor Cycling',
    NULL,
    ARRAY['Spin', 'Cardio', 'Endurance']
  )
ON CONFLICT DO NOTHING;


-- ─── Staff roles ─────────────────────────────────────────────────────────────

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 1, ARRAY['Strength & Conditioning', 'Power Hour']
    FROM staff WHERE name = 'Keith'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 2, ARRAY['HIIT Bootcamp', 'Functional Fitness']
    FROM staff WHERE name = 'Dave'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 3, ARRAY['Boxing Fundamentals', 'Athletic Performance', 'Power Hour']
    FROM staff WHERE name = 'Joel'
  ON CONFLICT (staff_id, role) DO NOTHING;

-- Bee is both a personal trainer and a group instructor
INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 4, ARRAY['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore']
    FROM staff WHERE name = 'Bee'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 1, ARRAY['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore']
    FROM staff WHERE name = 'Bee'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 5, ARRAY['Spin Class', 'Nutrition Workshop']
    FROM staff WHERE name = 'Prabh'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 2, ARRAY['Boxing', 'HIIT', 'Conditioning']
    FROM staff WHERE name = 'Marcus'
  ON CONFLICT (staff_id, role) DO NOTHING;

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 3, ARRAY['Spin', 'Cardio', 'Endurance']
    FROM staff WHERE name = 'Dana'
  ON CONFLICT (staff_id, role) DO NOTHING;


-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Both tables are public marketing content, so anyone can SELECT.
-- INSERT / UPDATE / DELETE are intentionally left with no policy here.
-- Those operations will be added in a later phase, scoped to
-- authenticated admin users only (service-role key, not anon).

ALTER TABLE staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read staff"       ON staff;
DROP POLICY IF EXISTS "Public read staff_roles" ON staff_roles;

CREATE POLICY "Public read staff"
  ON staff FOR SELECT USING (true);

CREATE POLICY "Public read staff_roles"
  ON staff_roles FOR SELECT USING (true);

-- Grant SELECT to the anon and authenticated roles.
-- RLS policies control row visibility; GRANTs control table-level access.
-- Both are required for public reads to work.
GRANT SELECT ON staff       TO anon, authenticated;
GRANT SELECT ON staff_roles TO anon, authenticated;
