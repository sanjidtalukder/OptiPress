-- OptiPress Step 3: Session Files Table & Security Migration
-- Creates session_files metadata table with Row Level Security (RLS) policies.

CREATE TABLE IF NOT EXISTS public.session_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.app_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  extension TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session file lookups
CREATE INDEX IF NOT EXISTS idx_session_files_user_session ON public.session_files (user_id, session_id);

-- Enable RLS for Session Files
ALTER TABLE public.session_files ENABLE ROW LEVEL SECURITY;

-- Session Files RLS Policies
CREATE POLICY "Users can select own session files"
  ON public.session_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session files"
  ON public.session_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session files"
  ON public.session_files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own session files"
  ON public.session_files FOR DELETE
  USING (auth.uid() = user_id);
