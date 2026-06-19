-- ============================================================
-- 003_content_tables.sql
-- pricing_plans, testimonials, faqs, holiday_hours
-- ============================================================

-- ── pricing_plans ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_plans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  tagline        TEXT        NOT NULL DEFAULT '',
  monthly_price  NUMERIC     NOT NULL,
  yearly_price   NUMERIC,
  features       TEXT[]      NOT NULL DEFAULT '{}',
  badge_text     TEXT,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read pricing_plans"
  ON pricing_plans FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert pricing_plans"
  ON pricing_plans FOR INSERT WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update pricing_plans"
  ON pricing_plans FOR UPDATE USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete pricing_plans"
  ON pricing_plans FOR DELETE USING (public.is_staff_admin());

GRANT SELECT ON pricing_plans TO anon, authenticated;

-- Seed
INSERT INTO pricing_plans (name, tagline, monthly_price, yearly_price, features, badge_text, display_order) VALUES
(
  'Results',
  'Month to Month',
  89.99,
  NULL,
  ARRAY[
    'Unlimited access to the facility',
    'Unlimited group fitness classes',
    '(3) 60-minute personal training sessions ($180 value)',
    'Ability to freeze membership',
    'Month-to-month agreement',
    'No long-term contract',
    'No hidden fees'
  ],
  NULL,
  1
),
(
  'Membership',
  'Month to Month / Annual',
  99.99,
  899,
  ARRAY[
    'Unlimited access to the facility',
    'Unlimited group fitness classes',
    'Ability to freeze membership',
    'Month-to-month or annual agreement',
    'No long-term contract',
    'No hidden fees'
  ],
  'Most Popular',
  2
);


-- ── testimonials ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  text           TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  detail         TEXT        NOT NULL DEFAULT '',
  stars          INTEGER     NOT NULL DEFAULT 5 CHECK (stars BETWEEN 1 AND 5),
  display_order  INTEGER     NOT NULL DEFAULT 0,
  active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read testimonials"
  ON testimonials FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert testimonials"
  ON testimonials FOR INSERT WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update testimonials"
  ON testimonials FOR UPDATE USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete testimonials"
  ON testimonials FOR DELETE USING (public.is_staff_admin());

GRANT SELECT ON testimonials TO anon, authenticated;

-- Seed
INSERT INTO testimonials (text, name, detail, stars, display_order) VALUES
(
  'I returned to the gym at age 70 and Keith has been fantastic — working with me to increase strength and improve health. I have put on muscle, lost weight, and significantly lowered my A1C.',
  'Michael Upchurch', 'Personal Training Client', 5, 1
),
(
  'Over 9 months I have gotten stronger, lost 25 pounds, and have less knee pain. Keith is super creative and makes training fun — even when it is really challenging.',
  'Sarah Bassingthwaighte', 'Personal Training Client', 5, 2
),
(
  'Bee incorporates Pilates, yoga and barre into our sessions. She focuses on holistic health and has taught me so much about moving energy and caring for my fascia.',
  'Miriam Berger', 'Personal Training Client', 5, 3
),
(
  'Best gym in Capitol Hill, hands down. The staff actually know your name and care about your progress. The HIIT classes with Coach Avery are absolutely brutal in the best way.',
  'James Thornton', 'Premier Member', 5, 4
);


-- ── faqs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  question       TEXT        NOT NULL,
  answer         TEXT        NOT NULL,
  display_order  INTEGER     NOT NULL DEFAULT 0,
  active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read faqs"
  ON faqs FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert faqs"
  ON faqs FOR INSERT WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update faqs"
  ON faqs FOR UPDATE USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete faqs"
  ON faqs FOR DELETE USING (public.is_staff_admin());

GRANT SELECT ON faqs TO anon, authenticated;

-- Seed
INSERT INTO faqs (question, answer, display_order) VALUES
('Do I need to sign a contract?',
 'No contracts at PNW Fitness. All memberships are month-to-month and can be cancelled at any time with 30 days notice.',
 1),
('Can I try the gym before joining?',
 'Absolutely. Walk in during staffed hours and we will give you a full tour. Day passes are available for $20 so you can try a full workout before committing.',
 2),
('Are group classes included in my membership?',
 'Yes — all group fitness classes are included with Premier and Elite memberships at no extra cost. Basic members can add classes for a small per-class fee.',
 3),
('What is an NASM-Approved Facility?',
 'The National Academy of Sports Medicine certifies facilities that meet their standards for equipment, training practices, and coach credentials. We are the only NASM-Approved gym in Capitol Hill.',
 4),
('Do you offer personal training?',
 'Yes. All our trainers are NASM-certified and available for one-on-one sessions. Elite members receive 2 sessions per month included. Sessions can also be purchased individually.',
 5),
('Where are you located?',
 '401 Broadway E, Suite 301, Seattle, WA 98102 — on Capitol Hill, above the QFC grocery store. Street parking is available on Broadway and surrounding streets.',
 6);


-- ── holiday_hours ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS holiday_hours (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  year              INTEGER     NOT NULL,
  month             INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  day               INTEGER     NOT NULL CHECK (day BETWEEN 1 AND 31),
  label             TEXT        NOT NULL,
  status            TEXT        NOT NULL CHECK (status IN ('closed', 'regular', 'custom')),
  open_at_minutes   INTEGER,
  close_at_minutes  INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year, month, day)
);

ALTER TABLE holiday_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read holiday_hours"
  ON holiday_hours FOR SELECT USING (TRUE);

CREATE POLICY "Admins can insert holiday_hours"
  ON holiday_hours FOR INSERT WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can update holiday_hours"
  ON holiday_hours FOR UPDATE USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin());

CREATE POLICY "Admins can delete holiday_hours"
  ON holiday_hours FOR DELETE USING (public.is_staff_admin());

GRANT SELECT ON holiday_hours TO anon, authenticated;

-- Seed (sourced verbatim from HOLIDAYS array in Hero.jsx)
INSERT INTO holiday_hours (year, month, day, label, status, open_at_minutes, close_at_minutes) VALUES
(2026,  1,  1,  'New Year''s Day',          'custom',  600,  1260),
(2026,  1, 19,  'MLK Jr. Day',              'custom',  540,  1140),
(2026,  2, 16,  'Presidents'' Day',          'regular', NULL, NULL),
(2026,  4,  5,  'Easter',                   'custom',  480,   840),
(2026,  5, 25,  'Memorial Day',             'custom',  540,  1140),
(2026,  6, 19,  'Juneteenth',               'custom',  540,  1140),
(2026,  6, 27,  'Cap Hill Pride',           'custom',  480,   840),
(2026,  6, 28,  'Seattle Pride',            'custom',  840,  1200),
(2026,  7,  4,  'Independence Day',         'custom',  480,   840),
(2026,  7,  5,  'Day After July 4th',       'custom',  840,  1200),
(2026,  9,  7,  'Labor Day',                'custom',  540,  1140),
(2026, 10, 12,  'Indigenous Peoples'' Day', 'custom',  540,  1140),
(2026, 11, 11,  'Veterans Day',             'custom',  540,  1140),
(2026, 11, 26,  'Thanksgiving',             'custom',  360,   840),
(2026, 11, 27,  'Black Friday',             'custom',  780,  1260),
(2026, 12, 24,  'Christmas Eve',            'custom',  360,   840),
(2026, 12, 25,  'Christmas Day',            'closed',  NULL, NULL),
(2026, 12, 26,  'Day After Christmas',      'custom',  840,  1200),
(2026, 12, 31,  'New Year''s Eve',          'custom',  360,   840),
(2027,  1,  1,  'New Year''s Day',          'custom',  780,  1260);
