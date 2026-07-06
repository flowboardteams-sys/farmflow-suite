
-- Seed super admin auth user
DO $$
DECLARE
  _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'superadmin@herdos.com';
  IF _uid IS NULL THEN
    _uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', _uid, 'authenticated', 'authenticated',
      'superadmin@herdos.com', crypt('SuperAdmin2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb, false
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), _uid,
      jsonb_build_object('sub', _uid::text, 'email', 'superadmin@herdos.com', 'email_verified', true),
      'email', _uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.profiles (id, full_name, is_super_admin)
  VALUES (_uid, 'Super Admin', true)
  ON CONFLICT (id) DO UPDATE SET is_super_admin = true, full_name = 'Super Admin';
END $$;
