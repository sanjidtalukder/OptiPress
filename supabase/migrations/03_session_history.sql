-- OptiPress Step 8: Ephemeral Session History Table & Security Migration
-- Creates session_history table with Row Level Security (RLS) policies.

CREATE TABLE IF NOT EXISTS public.session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.app_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.session_files(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  extension TEXT NOT NULL,
  original_size BIGINT NOT NULL,
  output_size BIGINT NOT NULL,
  operation TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  reduction_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  result_storage_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_session_history_user_session ON public.session_history (user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_history_created_at ON public.session_history (created_at);

-- Enable RLS for Session History
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- Session History RLS Policies
CREATE POLICY "Users can select own session history"
  ON public.session_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session history"
  ON public.session_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session history"
  ON public.session_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session history"
  ON public.session_history FOR DELETE
  USING (auth.uid() = user_id);
