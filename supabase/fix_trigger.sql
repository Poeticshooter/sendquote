CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, user_id, business_name, plan)
  VALUES (NEW.id, NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 'free')
  ON CONFLICT (user_id) DO UPDATE SET business_name = EXCLUDED.business_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
