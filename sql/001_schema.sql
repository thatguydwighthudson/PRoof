-- ============================================================
-- WORKOUT APP — SCHEMA
-- 001_schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- preferred_unit: 'kg' or 'lbs' — drives all display + input.
-- ============================================================
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(255) UNIQUE,
  preferred_unit   VARCHAR(3)   NOT NULL DEFAULT 'lbs' CHECK (preferred_unit IN ('kg','lbs')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MUSCLE GROUPS
-- ============================================================
CREATE TABLE muscle_groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  body_region VARCHAR(50)  NOT NULL
);

-- ============================================================
-- EXERCISE LIBRARY
-- is_bodyweight: TRUE = no weight input shown in the UI
-- ============================================================
CREATE TABLE exercises (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL UNIQUE,
  muscle_group_id   INT          REFERENCES muscle_groups(id),
  secondary_muscles TEXT[],
  equipment         VARCHAR(100),
  difficulty        VARCHAR(20)  CHECK (difficulty IN ('beginner','intermediate','advanced')),
  instructions      TEXT,
  youtube_query     VARCHAR(200),
  is_bodyweight     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_custom         BOOLEAN      NOT NULL DEFAULT FALSE,
  user_id           INT          REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CARDIO EXERCISES
-- ============================================================
CREATE TABLE cardio_exercises (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL UNIQUE,
  category      VARCHAR(50)  NOT NULL,
  equipment     VARCHAR(100),
  instructions  TEXT,
  youtube_query VARCHAR(200),
  is_custom     BOOLEAN      NOT NULL DEFAULT FALSE,
  user_id       INT          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKOUT PLANS
-- ============================================================
CREATE TABLE workout_plans (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  split_type  VARCHAR(50),
  is_custom   BOOLEAN      NOT NULL DEFAULT FALSE,
  user_id     INT          REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXERCISES WITHIN A PLAN
-- superset_group_id: matching int = paired exercises done back-to-back
-- ============================================================
CREATE TABLE workout_plan_exercises (
  id                   SERIAL PRIMARY KEY,
  plan_id              INT         NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  exercise_id          INT         NOT NULL REFERENCES exercises(id),
  sort_order           INT         NOT NULL DEFAULT 0,
  default_sets         INT         NOT NULL DEFAULT 3,
  default_reps         VARCHAR(20) NOT NULL DEFAULT '8-12',
  default_weight       NUMERIC(6,2),
  default_rest_seconds INT         NOT NULL DEFAULT 90,
  superset_group_id    INT         DEFAULT NULL
);

-- ============================================================
-- PROGRAMS
-- deload_week_interval: deload every N weeks (0 = disabled)
-- ============================================================
CREATE TABLE programs (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(150) NOT NULL,
  description          TEXT,
  days_per_week        SMALLINT     NOT NULL DEFAULT 6,
  deload_week_interval SMALLINT     NOT NULL DEFAULT 4,
  is_custom            BOOLEAN      NOT NULL DEFAULT FALSE,
  user_id              INT          REFERENCES users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROGRAM DAYS
-- ============================================================
CREATE TABLE program_days (
  id         SERIAL PRIMARY KEY,
  program_id INT      NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL,
  plan_id    INT      REFERENCES workout_plans(id),
  rest_day   BOOLEAN  NOT NULL DEFAULT FALSE,
  label      VARCHAR(100),
  UNIQUE (program_id, day_number)
);

-- ============================================================
-- USER PROGRAMS
-- ============================================================
CREATE TABLE user_programs (
  id               SERIAL PRIMARY KEY,
  user_id          INT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id       INT      NOT NULL REFERENCES programs(id),
  started_at       DATE     NOT NULL DEFAULT CURRENT_DATE,
  current_week     INT      NOT NULL DEFAULT 1,
  next_day_number  SMALLINT NOT NULL DEFAULT 1,
  is_active        BOOLEAN  NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, program_id, started_at)
);

-- ============================================================
-- WORKOUT SESSIONS
-- is_deload: TRUE = lighter week, charts exclude from PR calc
-- cloned_from_id: set when session was copied from history
-- ============================================================
CREATE TABLE workout_sessions (
  id             SERIAL PRIMARY KEY,
  user_id        INT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id        INT      REFERENCES workout_plans(id),
  session_date   DATE     NOT NULL DEFAULT CURRENT_DATE,
  started_at     TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  duration_mins  INT,
  session_notes  TEXT,
  overall_feel   SMALLINT CHECK (overall_feel BETWEEN 1 AND 5),
  is_deload      BOOLEAN  NOT NULL DEFAULT FALSE,
  cloned_from_id INT      REFERENCES workout_sessions(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXERCISES LOGGED IN A SESSION
-- ============================================================
CREATE TABLE session_exercises (
  id           SERIAL PRIMARY KEY,
  session_id   INT     NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id  INT     NOT NULL REFERENCES exercises(id),
  sort_order   INT     NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDIVIDUAL SETS
-- is_warmup: TRUE = excluded from charts and PR calculations
-- weight_kg: always stored in kg; UI converts per preferred_unit
-- rpe: Rate of Perceived Exertion 1-10 (optional per set)
-- ============================================================
CREATE TABLE session_sets (
  id                  SERIAL PRIMARY KEY,
  session_exercise_id INT          NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_number          INT          NOT NULL,
  reps                INT,
  weight_kg           NUMERIC(6,2),
  is_warmup           BOOLEAN      NOT NULL DEFAULT FALSE,
  is_completed        BOOLEAN      NOT NULL DEFAULT FALSE,
  rpe                 SMALLINT     CHECK (rpe BETWEEN 1 AND 10),
  notes               TEXT,
  logged_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CARDIO LOGGED IN A SESSION
-- ============================================================
CREATE TABLE session_cardio (
  id                 SERIAL PRIMARY KEY,
  session_id         INT         NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  cardio_exercise_id INT         REFERENCES cardio_exercises(id),
  custom_name        VARCHAR(150),
  duration_mins      INT,
  distance_km        NUMERIC(6,2),
  intensity          VARCHAR(20) CHECK (intensity IN ('low','moderate','high','max')),
  calories_burned    INT,
  notes              TEXT,
  logged_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PERSONAL RECORDS
-- One row per user+exercise. Auto-updated after each session.
-- Deload sessions are excluded from PR calculations.
-- ============================================================
CREATE TABLE personal_records (
  id                       SERIAL PRIMARY KEY,
  user_id                  INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id              INT          NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  best_weight_kg           NUMERIC(6,2),
  best_weight_reps         INT,
  best_reps                INT,
  best_volume_kg           NUMERIC(8,2),
  best_weight_session_id   INT          REFERENCES workout_sessions(id),
  best_reps_session_id     INT          REFERENCES workout_sessions(id),
  best_volume_session_id   INT          REFERENCES workout_sessions(id),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exercise_id)
);

-- ============================================================
-- BODY METRICS (weekly check-in)
-- All measurements stored in metric; UI converts per preferred_unit
-- ============================================================
CREATE TABLE body_metrics (
  id           SERIAL PRIMARY KEY,
  user_id      INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_date  DATE         NOT NULL DEFAULT CURRENT_DATE,
  weight_kg    NUMERIC(5,2),
  body_fat_pct NUMERIC(4,1),
  chest_cm     NUMERIC(5,1),
  waist_cm     NUMERIC(5,1),
  hips_cm      NUMERIC(5,1),
  bicep_cm     NUMERIC(5,1),
  thigh_cm     NUMERIC(5,1),
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_date)
);

-- ============================================================
-- PROGRESSIVE OVERLOAD SUGGESTIONS
-- Computed after each session completes.
-- Logic: if all working sets completed at RPE <= 8 (or no RPE),
-- suggest 2.5% increase for upper body, 5% for lower body.
-- is_applied flips TRUE once the suggestion is used in a session.
-- ============================================================
CREATE TABLE progressive_overload_suggestions (
  id                  SERIAL PRIMARY KEY,
  user_id             INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id         INT          NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  last_weight_kg      NUMERIC(6,2) NOT NULL,
  suggested_weight_kg NUMERIC(6,2) NOT NULL,
  based_on_session_id INT          NOT NULL REFERENCES workout_sessions(id),
  is_applied          BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exercise_id, based_on_session_id)
);

-- ============================================================
-- PUSH NOTIFICATION SUBSCRIPTIONS (PWA Web Push)
-- ============================================================
CREATE TABLE push_subscriptions (
  id         SERIAL PRIMARY KEY,
  user_id    INT     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT    NOT NULL UNIQUE,
  p256dh     TEXT    NOT NULL,
  auth       TEXT    NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKOUT REMINDERS
-- days_of_week: array of ints 1=Mon...7=Sun
-- ============================================================
CREATE TABLE workout_reminders (
  id           SERIAL PRIMARY KEY,
  user_id      INT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remind_time  TIME       NOT NULL DEFAULT '07:00',
  days_of_week SMALLINT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7],
  is_active    BOOLEAN    NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXERCISE ALTERNATIVES
-- ============================================================
CREATE TABLE exercise_alternatives (
  id               SERIAL PRIMARY KEY,
  exercise_id      INT      NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  alternative_id   INT      NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  similarity_score SMALLINT NOT NULL DEFAULT 3 CHECK (similarity_score BETWEEN 1 AND 5),
  notes            TEXT,
  CHECK (exercise_id <> alternative_id),
  UNIQUE (exercise_id, alternative_id)
);

-- ============================================================
-- PLAN EXERCISE VARIATIONS (weekly rotation)
-- ============================================================
CREATE TABLE plan_exercise_variations (
  id                   SERIAL PRIMARY KEY,
  plan_id              INT         NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  base_exercise_id     INT         NOT NULL REFERENCES exercises(id),
  variant_exercise_id  INT         NOT NULL REFERENCES exercises(id),
  week_number          SMALLINT    NOT NULL,
  sort_order           INT         NOT NULL DEFAULT 0,
  default_sets         INT         NOT NULL DEFAULT 3,
  default_reps         VARCHAR(20) NOT NULL DEFAULT '8-12',
  default_rest_seconds INT         NOT NULL DEFAULT 90,
  CHECK (base_exercise_id <> variant_exercise_id)
);

-- ============================================================
-- SESSION EXERCISE SWAPS
-- ============================================================
CREATE TABLE session_exercise_swaps (
  id                   SERIAL PRIMARY KEY,
  session_exercise_id  INT     NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  original_exercise_id INT     NOT NULL REFERENCES exercises(id),
  swapped_exercise_id  INT     NOT NULL REFERENCES exercises(id),
  is_suggested         BOOLEAN NOT NULL DEFAULT FALSE,
  swapped_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_session_date              ON workout_sessions(session_date DESC);
CREATE INDEX idx_session_user              ON workout_sessions(user_id);
CREATE INDEX idx_session_exercises         ON session_exercises(session_id);
CREATE INDEX idx_session_sets              ON session_sets(session_exercise_id);
CREATE INDEX idx_session_sets_working      ON session_sets(session_exercise_id) WHERE is_warmup = FALSE;
CREATE INDEX idx_session_cardio            ON session_cardio(session_id);
CREATE INDEX idx_plan_exercises_plan       ON workout_plan_exercises(plan_id);
CREATE INDEX idx_exercises_muscle          ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_user            ON exercises(user_id);
CREATE INDEX idx_plans_user                ON workout_plans(user_id);
CREATE INDEX idx_program_days_program      ON program_days(program_id);
CREATE INDEX idx_user_programs_user        ON user_programs(user_id);
CREATE INDEX idx_user_programs_active      ON user_programs(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_exercise_alternatives     ON exercise_alternatives(exercise_id);
CREATE INDEX idx_plan_variations_plan      ON plan_exercise_variations(plan_id, week_number);
CREATE INDEX idx_session_swaps             ON session_exercise_swaps(session_exercise_id);
CREATE INDEX idx_personal_records_user     ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX idx_body_metrics_user         ON body_metrics(user_id, logged_date DESC);
CREATE INDEX idx_overload_pending          ON progressive_overload_suggestions(user_id, exercise_id) WHERE is_applied = FALSE;
CREATE INDEX idx_push_subscriptions_user   ON push_subscriptions(user_id);
