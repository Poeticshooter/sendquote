-- Enable RLS on system tables that are missing it
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Add user_id column to ai_cache for RLS (it was missing)
ALTER TABLE public.ai_cache ADD COLUMN IF NOT EXISTS user_id uuid;

-- RLS for error_logs: only visible to the user who owns them or admins
CREATE POLICY "Users can view own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM public.profiles WHERE plan IN ('enterprise', 'pro')));

-- RLS for admin_audit_log: only admins can view
CREATE POLICY "Only admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE plan IN ('enterprise', 'pro')));

-- RLS for ai_cache: user-scoped access (based on user_id in cache)
CREATE POLICY "Users can access own AI cache" ON public.ai_cache
  FOR ALL USING (auth.uid() = user_id);
