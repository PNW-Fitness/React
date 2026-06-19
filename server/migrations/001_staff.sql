-- ─────────────────────────────────────────────────────────────────────────────
-- 001_staff.sql  —  Staff + roles schema + seed data
-- Run:  psql $DATABASE_URL -f migrations/001_staff.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff (
  id          SERIAL PRIMARY KEY,
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
  id             SERIAL PRIMARY KEY,
  staff_id       INT  NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('personal_trainer', 'group_instructor')),
  display_order  INT  NOT NULL DEFAULT 0,
  classes_taught TEXT[],
  UNIQUE (staff_id, role)
);

-- ─── Seed ────────────────────────────────────────────────────────────────────

INSERT INTO staff (name, photo_url, initial, cert, specialty, bio, tags) VALUES
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
  );

-- Personal trainer roles (Keith, Dave, Joel, Bee, Prabh)
INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 1, ARRAY['Strength & Conditioning', 'Power Hour']
    FROM staff WHERE name = 'Keith';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 2, ARRAY['HIIT Bootcamp', 'Functional Fitness']
    FROM staff WHERE name = 'Dave';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 3, ARRAY['Boxing Fundamentals', 'Athletic Performance', 'Power Hour']
    FROM staff WHERE name = 'Joel';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 4, ARRAY['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore']
    FROM staff WHERE name = 'Bee';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'personal_trainer', 5, ARRAY['Spin Class', 'Nutrition Workshop']
    FROM staff WHERE name = 'Prabh';

-- Group instructor roles (Bee, Marcus, Dana)
INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 1, ARRAY['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore']
    FROM staff WHERE name = 'Bee';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 2, ARRAY['Boxing', 'HIIT', 'Conditioning']
    FROM staff WHERE name = 'Marcus';

INSERT INTO staff_roles (staff_id, role, display_order, classes_taught)
  SELECT id, 'group_instructor', 3, ARRAY['Spin', 'Cardio', 'Endurance']
    FROM staff WHERE name = 'Dana';
