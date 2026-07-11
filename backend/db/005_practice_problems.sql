-- Practice Problems Tables

CREATE TABLE IF NOT EXISTS practice_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  expected_complexity VARCHAR(20),
  constraints TEXT,
  sample_input TEXT,
  sample_output TEXT,
  hints JSONB,
  input_format TEXT,
  output_format TEXT,
  reference_code TEXT,
  reference_language VARCHAR(20) DEFAULT 'python',
  total_attempts INT DEFAULT 0,
  accepted_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS problem_topics (
  problem_id UUID REFERENCES practice_problems(id) ON DELETE CASCADE,
  topic VARCHAR(50) NOT NULL,
  PRIMARY KEY (problem_id, topic)
);

CREATE TABLE IF NOT EXISTS problem_companies (
  problem_id UUID REFERENCES practice_problems(id) ON DELETE CASCADE,
  company VARCHAR(100) NOT NULL,
  PRIMARY KEY (problem_id, company)
);

CREATE TABLE IF NOT EXISTS practice_testcases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES practice_problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES practice_problems(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('solved', 'attempted', 'failed')),
  code TEXT NOT NULL,
  language VARCHAR(20) NOT NULL,
  runtime_ms FLOAT,
  memory_mb FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_practice_problems_title ON practice_problems(title);
CREATE INDEX IF NOT EXISTS idx_practice_problems_diff ON practice_problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problem_topics_topic ON problem_topics(topic);
CREATE INDEX IF NOT EXISTS idx_problem_companies_comp ON problem_companies(company);
CREATE INDEX IF NOT EXISTS idx_practice_submissions_user_prob ON practice_submissions(user_id, problem_id);
