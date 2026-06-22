-- Create log_analyses table to store analyzed log files
CREATE TABLE IF NOT EXISTS log_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  log_content TEXT NOT NULL,
  analysis_result TEXT NOT NULL,
  log_type TEXT,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE log_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this app)
CREATE POLICY "select_log_analyses" ON log_analyses FOR SELECT
  USING (true);

CREATE POLICY "insert_log_analyses" ON log_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "delete_log_analyses" ON log_analyses FOR DELETE
  USING (true);

-- Create index for ordering by date
CREATE INDEX idx_log_analyses_created_at ON log_analyses(created_at DESC);