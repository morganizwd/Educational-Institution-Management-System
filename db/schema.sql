-- PostgreSQL schema for Educational Institution Management System (PERN backend)

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  email       VARCHAR(200) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'student',
  full_name   VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  duration    VARCHAR(100) NOT NULL,
  instructor  VARCHAR(255) NOT NULL,
  price       INTEGER      NOT NULL,
  category    VARCHAR(100) NOT NULL,
  available   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id    INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress     INTEGER      NOT NULL DEFAULT 0,
  CONSTRAINT enrollments_unique UNIQUE (user_id, course_id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  status     VARCHAR(20)  NOT NULL DEFAULT 'new'
);

CREATE TABLE IF NOT EXISTS schedule (
  id            SERIAL PRIMARY KEY,
  course_id     INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id INTEGER     NOT NULL REFERENCES users(id),
  title         VARCHAR(255),
  content       TEXT,
  day_of_week   VARCHAR(50) NOT NULL,
  time          VARCHAR(50) NOT NULL,
  room          VARCHAR(100) NOT NULL,
  type          VARCHAR(50) NOT NULL,
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ответы студентов по занятиям (урокам)
CREATE TABLE IF NOT EXISTS lesson_submissions (
  id            SERIAL PRIMARY KEY,
  enrollment_id INTEGER     NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  schedule_id   INTEGER     NOT NULL REFERENCES schedule(id) ON DELETE CASCADE,
  answer        TEXT        NOT NULL,
  is_approved   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lesson_submissions_unique UNIQUE (enrollment_id, schedule_id)
);

CREATE TABLE IF NOT EXISTS educational_processes (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER     NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  "order"     INTEGER      NOT NULL,
  materials   TEXT[]       NOT NULL DEFAULT '{}',
  deadline    DATE,
  active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      VARCHAR(255) PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

