-- Create backup history table
CREATE TABLE public.backup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  backup_type TEXT NOT NULL DEFAULT 'manual',
  total_records INTEGER NOT NULL DEFAULT 0,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Admins can manage backup history
CREATE POLICY "Admins can manage backup history"
ON public.backup_history
FOR ALL
USING (is_admin(auth.uid()));

-- Authenticated users can view backup history
CREATE POLICY "Authenticated users can view backup history"
ON public.backup_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add index for faster queries
CREATE INDEX idx_backup_history_created_at ON public.backup_history(created_at DESC);