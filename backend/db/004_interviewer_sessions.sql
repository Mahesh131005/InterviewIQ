-- Migration: Add interviewer_sessions table for AI Interviewer Conversation Module
-- Run: psql -U postgres -d coding_interview -f db/004_interviewer_sessions.sql

CREATE TABLE IF NOT EXISTS interviewer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  company_track VARCHAR(100),
  conversation_history JSONB DEFAULT '[]',
  explanation_score FLOAT DEFAULT 0,
  behavioral_score FLOAT DEFAULT 0,
  explanation_feedback TEXT,
  behavioral_feedback TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interviewer_sessions_user_id ON interviewer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interviewer_sessions_interview_id ON interviewer_sessions(interview_id);
