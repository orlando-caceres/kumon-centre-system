CREATE DATABASE IF NOT EXISTS kumon_centre CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kumon_centre;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','STAFF') NOT NULL DEFAULT 'STAFF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(32) NOT NULL UNIQUE,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  display_name VARCHAR(220) NOT NULL,
  status ENUM('ACTIVE','NEW','FREE_TRIAL','TEMPORARY_ABSENCE','EXTENDED_ABSENCE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  previous_status ENUM('ACTIVE','NEW','FREE_TRIAL') NULL,
  inactive_from DATE NULL,
  inactive_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_students_name (display_name),
  INDEX idx_students_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrolments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  subject ENUM('ENGLISH','MATH','INTERACTIVE') NOT NULL,
  math_level ENUM('3A-A','B-D','E+') NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enrol_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY uq_enrolment (student_id, subject, math_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS allocations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  enrolment_id BIGINT UNSIGNED NOT NULL,
  day_of_week ENUM('Monday','Tuesday','Thursday','Friday') NOT NULL,
  centre_timeslot ENUM('3:45 pm','4:30 pm','5:15 pm','6:00 pm') NOT NULL,
  raw_time VARCHAR(20) NULL,
  section ENUM('English','3A-A Math','B-D Math','E+ Math','Interactive') NOT NULL,
  is_reserved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alloc_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_alloc_enrol FOREIGN KEY (enrolment_id) REFERENCES enrolments(id) ON DELETE CASCADE,
  UNIQUE KEY uq_allocation (student_id, enrolment_id, day_of_week, centre_timeslot),
  INDEX idx_alloc_slot (day_of_week, centre_timeslot, section)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS absences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  return_date DATE NOT NULL,
  absence_type ENUM('TEMPORARY','EXTENDED') NOT NULL,
  ended_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_abs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CHECK (return_date >= start_date),
  INDEX idx_abs_dates (start_date, return_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS waitlist (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id BIGINT UNSIGNED NOT NULL,
  preferred_day ENUM('Monday','Tuesday','Thursday','Friday') NOT NULL,
  preferred_timeslot ENUM('3:45 pm','4:30 pm','5:15 pm','6:00 pm') NOT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('WAITING','ALLOCATED','CANCELLED') NOT NULL DEFAULT 'WAITING',
  notes VARCHAR(500) NULL,
  CONSTRAINT fk_wait_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_wait_status (status, preferred_day, preferred_timeslot)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS waitlist_requirements (
  waitlist_id BIGINT UNSIGNED NOT NULL,
  section ENUM('English','3A-A Math','B-D Math','E+ Math','Interactive') NOT NULL,
  PRIMARY KEY (waitlist_id, section),
  CONSTRAINT fk_wait_req FOREIGN KEY (waitlist_id) REFERENCES waitlist(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  student_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX idx_audit_student (student_id, created_at),
  INDEX idx_audit_action (action, created_at)
) ENGINE=InnoDB;
