-- PostgreSQL Schema for AI Code Interviewer
-- Run this file to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  difficulty_bias JSONB DEFAULT '{"easy": 20, "medium": 50, "hard": 30}',
  description TEXT,
  logo_url VARCHAR(255),
  total_questions INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_complexity VARCHAR(20), -- O(n), O(n^2), O(n log n), etc
  topic VARCHAR(50) NOT NULL, -- array, dp, graph, string, etc
  company_id UUID NOT NULL,
  constraints TEXT,
  sample_input TEXT,
  sample_output TEXT,
  hints JSONB,
  input_format TEXT,
  output_format TEXT,
  reference_code TEXT,
  reference_language VARCHAR(20) DEFAULT 'python',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Test Cases Table
CREATE TABLE testcases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Interviews Table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  overall_score FLOAT DEFAULT 0,
  confidence_score FLOAT DEFAULT 0,
  total_questions INT DEFAULT 0,
  completed_questions INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, abandoned
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Submissions Table (responses to each question)
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID NOT NULL,
  question_id UUID NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL, -- cpp, python, java
  correctness_score FLOAT DEFAULT 0, -- 0-1
  efficiency_score FLOAT DEFAULT 0, -- 0-1
  explanation TEXT,
  explanation_score FLOAT DEFAULT 0, -- 0-1
  behavioral_note TEXT,
  behavioral_score FLOAT DEFAULT 0, -- 0-1
  runtime_ms FLOAT,
  memory_mb FLOAT,
  predicted_complexity VARCHAR(20),
  expected_complexity VARCHAR(20),
  passed_testcases INT DEFAULT 0,
  total_testcases INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Topic Performance Tracking
CREATE TABLE topic_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  topic VARCHAR(50) NOT NULL,
  avg_score FLOAT DEFAULT 0,
  total_attempts INT DEFAULT 0,
  correct_attempts INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, topic)
);

-- Company Performance by User
CREATE TABLE company_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  total_interviews INT DEFAULT 0,
  avg_score FLOAT DEFAULT 0,
  last_interview_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(user_id, company_id)
);

-- Session Performance History (for trending)
CREATE TABLE session_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  interview_id UUID,
  score FLOAT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE SET NULL
);

-- Create Indexes for Performance
CREATE INDEX idx_questions_company_id ON questions(company_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_testcases_question_id ON testcases(question_id);
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_company_id ON interviews(company_id);
CREATE INDEX idx_submissions_interview_id ON submissions(interview_id);
CREATE INDEX idx_submissions_question_id ON submissions(question_id);
CREATE INDEX idx_topic_performance_user_id ON topic_performance(user_id);
CREATE INDEX idx_company_performance_user_id ON company_performance(user_id);
CREATE INDEX idx_session_history_user_id ON session_history(user_id);

-- Insert Sample Companies
INSERT INTO companies (name, difficulty_bias, description) VALUES
('Google', '{"easy": 15, "medium": 35, "hard": 50}', 'Google - Focusing on system design and algorithmic problem solving'),
('Amazon', '{"easy": 20, "medium": 40, "hard": 40}', 'Amazon - Emphasis on arrays, strings, and backend systems'),
('Meta', '{"easy": 15, "medium": 45, "hard": 40}', 'Meta (Facebook) - Dynamic programming and graphs'),
('Goldman Sachs', '{"easy": 25, "medium": 45, "hard": 30}', 'Goldman Sachs - Finance-focused algorithms'),
('Adobe', '{"easy": 30, "medium": 40, "hard": 30}', 'Adobe - Graphics and design algorithm problems'),
('SAP Labs', '{"easy": 35, "medium": 35, "hard": 30}', 'SAP Labs - Enterprise solutions and optimization'),
('Microsoft', '{"easy": 20, "medium": 40, "hard": 40}', 'Microsoft - Trees, graphs, and optimization'),
('Apple', '{"easy": 15, "medium": 40, "hard": 45}', 'Apple - Hardware-adjacent algorithms');
