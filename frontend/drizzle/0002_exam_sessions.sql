-- Add exam_sessions table and update feedbacks table
-- Migration: 20250109_add_exam_sessions

-- Update feedbacks table to add exam_session_id foreign key
ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS exam_session_id UUID REFERENCES exam_sessions(id);

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_ids TEXT[] NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_time_spent INTEGER DEFAULT 0,
  total_score INTEGER,
  average_level VARCHAR(10),
  report JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for exam_sessions
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_completed ON exam_sessions(completed_at);

-- Create index for feedbacks.exam_session_id
CREATE INDEX IF NOT EXISTS idx_feedbacks_exam_session ON feedbacks(exam_session_id);
