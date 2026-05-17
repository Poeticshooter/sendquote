-- Migration 030: Fix handle_new_user trigger to work across schemas
-- The trigger runs from auth.users context and needs explicit schema reference

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, business_name, plan)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
