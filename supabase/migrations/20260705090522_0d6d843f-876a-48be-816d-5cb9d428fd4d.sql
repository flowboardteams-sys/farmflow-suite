
-- =========================================================================
-- PHASE 1: FOUNDATION SCHEMA
-- =========================================================================

-- Utility: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM (
  'owner','farm_manager','veterinarian','accountant',
  'inventory_manager','hr_manager','milker','worker','custom'
);
CREATE TYPE public.member_status AS ENUM ('active','invited','suspended');
CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','revoked','expired');
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','canceled','expired');
CREATE TYPE public.plan_code AS ENUM ('basic','elite','enterprise');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  locale TEXT DEFAULT 'en',
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.plan_code NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated, anon;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO authenticated, anon USING (is_active = true);
CREATE TRIGGER trg_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.plans (code, name, description, monthly_price, annual_price, limits) VALUES
  ('basic','Basic','Great for small farms getting started', 29, 290, '{"animals":50,"users":3,"locations":1}'),
  ('elite','Elite','For growing farms with more animals and staff', 79, 790, '{"animals":500,"users":10,"locations":3}'),
  ('enterprise','Enterprise','Unlimited scale for multi-farm operations', 199, 1990, '{"animals":-1,"users":-1,"locations":-1}');

-- ============ FARMS ============
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  description TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  currency TEXT NOT NULL DEFAULT 'USD',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farms TO authenticated;
GRANT ALL ON public.farms TO service_role;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FARM MEMBERS ============
CREATE TABLE public.farm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.member_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farm_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_members TO authenticated;
GRANT ALL ON public.farm_members TO service_role;
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_farm_members_updated_at BEFORE UPDATE ON public.farm_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_farm_members_user ON public.farm_members(user_id);
CREATE INDEX idx_farm_members_farm ON public.farm_members(farm_id);

-- ============ ROLES & PERMISSIONS ============
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE, -- null = system role
  name TEXT NOT NULL,
  code public.app_role NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farm_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(resource, action)
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_read_all" ON public.permissions FOR SELECT TO authenticated USING (true);

-- Seed permission catalog
INSERT INTO public.permissions (resource, action) VALUES
  ('animals','view'),('animals','create'),('animals','update'),('animals','delete'),
  ('health','view'),('health','create'),('health','update'),('health','delete'),
  ('breeding','view'),('breeding','create'),('breeding','update'),('breeding','delete'),
  ('milk','view'),('milk','create'),('milk','update'),('milk','delete'),
  ('inventory','view'),('inventory','create'),('inventory','update'),('inventory','delete'),
  ('assets','view'),('assets','create'),('assets','update'),('assets','delete'),
  ('finance','view'),('finance','create'),('finance','update'),('finance','delete'),('finance','approve'),
  ('hr','view'),('hr','create'),('hr','update'),('hr','delete'),
  ('marketplace','view'),('marketplace','create'),('marketplace','update'),('marketplace','delete'),
  ('orders','view'),('orders','create'),('orders','update'),('orders','delete'),
  ('reports','view'),('reports','export'),
  ('settings','view'),('settings','update'),
  ('members','view'),('members','invite'),('members','update'),('members','remove');

CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, farm_id, role_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user_farm ON public.user_roles(user_id, farm_id);

-- ============ SECURITY DEFINER FUNCTIONS (avoid recursive RLS) ============
CREATE OR REPLACE FUNCTION public.is_farm_member(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE user_id = _user_id AND farm_id = _farm_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_farm_owner(_user_id UUID, _farm_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.farms WHERE id = _farm_id AND owner_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _farm_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND ur.farm_id = _farm_id AND r.code = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _farm_id UUID, _resource TEXT, _action TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_farm_owner(_user_id, _farm_id)
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.role_permissions rp ON rp.role_id = ur.role_id
      JOIN public.permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = _user_id AND ur.farm_id = _farm_id
        AND p.resource = _resource AND p.action = _action
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = _user_id), false);
$$;

-- ============ NOW POLICIES USING THOSE FUNCTIONS ============
CREATE POLICY "farms_member_read" ON public.farms FOR SELECT TO authenticated
  USING (public.is_farm_member(auth.uid(), id) OR owner_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "farms_owner_insert" ON public.farms FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "farms_owner_update" ON public.farms FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "farms_owner_delete" ON public.farms FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "fm_read" ON public.farm_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_farm_member(auth.uid(), farm_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "fm_owner_manage" ON public.farm_members FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_farm_owner(auth.uid(), farm_id) OR public.is_super_admin(auth.uid()));

CREATE POLICY "roles_read" ON public.roles FOR SELECT TO authenticated
  USING (farm_id IS NULL OR public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "roles_manage" ON public.roles FOR ALL TO authenticated
  USING (farm_id IS NOT NULL AND public.is_farm_owner(auth.uid(), farm_id))
  WITH CHECK (farm_id IS NOT NULL AND public.is_farm_owner(auth.uid(), farm_id));

CREATE POLICY "rp_read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "rp_manage" ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND public.is_farm_owner(auth.uid(), r.farm_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND public.is_farm_owner(auth.uid(), r.farm_id)));

CREATE POLICY "ur_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_farm_owner(auth.uid(), farm_id));
CREATE POLICY "ur_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id)) WITH CHECK (public.is_farm_owner(auth.uid(), farm_id));

-- ============ FARM LOCATIONS ============
CREATE TABLE public.farm_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_locations TO authenticated;
GRANT ALL ON public.farm_locations TO service_role;
ALTER TABLE public.farm_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loc_member_read" ON public.farm_locations FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "loc_owner_write" ON public.farm_locations FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id)) WITH CHECK (public.is_farm_owner(auth.uid(), farm_id));
CREATE TRIGGER trg_farm_locations_updated_at BEFORE UPDATE ON public.farm_locations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_member_read" ON public.subscriptions FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "sub_owner_write" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id)) WITH CHECK (public.is_farm_owner(auth.uid(), farm_id));
CREATE TRIGGER trg_subs_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INVITATIONS ============
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  status public.invitation_status NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT ON public.invitations TO anon;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_owner_manage" ON public.invitations FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id)) WITH CHECK (public.is_farm_owner(auth.uid(), farm_id));
CREATE POLICY "inv_by_token_read" ON public.invitations FOR SELECT TO anon, authenticated USING (status = 'pending' AND expires_at > now());
CREATE TRIGGER trg_inv_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ ACTIVITY & AUDIT LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "act_member_read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "act_member_insert" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_farm_member(auth.uid(), farm_id) AND actor_id = auth.uid());
CREATE INDEX idx_activity_farm ON public.activity_logs(farm_id, created_at DESC);
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_owner_read" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_farm_owner(auth.uid(), farm_id) OR public.is_super_admin(auth.uid()));

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(farm_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_member_read" ON public.settings FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "settings_owner_write" ON public.settings FOR ALL TO authenticated
  USING (public.is_farm_owner(auth.uid(), farm_id)) WITH CHECK (public.is_farm_owner(auth.uid(), farm_id));
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SUPPORT TICKETS ============
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_own" ON public.support_tickets FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PLACEHOLDER MODULE TABLES ============
-- Populated by future phases; created now so route stubs can query safely.
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.farm_locations(id) ON DELETE SET NULL,
  tag_number TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.animals TO authenticated;
GRANT ALL ON public.animals TO service_role;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "animals_member_read" ON public.animals FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id));
CREATE POLICY "animals_member_write" ON public.animals FOR ALL TO authenticated
  USING (public.is_farm_member(auth.uid(), farm_id)) WITH CHECK (public.is_farm_member(auth.uid(), farm_id));

-- Simple placeholder pattern helper: same-shape tables
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['products','orders','employees','expenses','income','inventory_items','assets']) LOOP
    EXECUTE format('CREATE TABLE public.%I (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
      name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      deleted_at TIMESTAMPTZ
    )', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_member_read" ON public.%I FOR SELECT TO authenticated USING (public.is_farm_member(auth.uid(), farm_id))', t, t);
    EXECUTE format('CREATE POLICY "%s_member_write" ON public.%I FOR ALL TO authenticated USING (public.is_farm_member(auth.uid(), farm_id)) WITH CHECK (public.is_farm_member(auth.uid(), farm_id))', t, t);
  END LOOP;
END $$;

-- ============ RPC: bootstrap farm ============
-- Creates farm, primary location, owner membership, seed roles, trial subscription
CREATE OR REPLACE FUNCTION public.bootstrap_farm(
  _name TEXT,
  _location_name TEXT DEFAULT 'Main Location',
  _timezone TEXT DEFAULT 'UTC',
  _currency TEXT DEFAULT 'USD'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _farm_id UUID;
  _owner_role_id UUID;
  _basic_plan UUID;
  _uid UUID := auth.uid();
  _role RECORD;
  _perm RECORD;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.farms (owner_id, name, timezone, currency)
  VALUES (_uid, _name, _timezone, _currency) RETURNING id INTO _farm_id;

  INSERT INTO public.farm_locations (farm_id, name, is_primary)
  VALUES (_farm_id, _location_name, true);

  INSERT INTO public.farm_members (farm_id, user_id, status) VALUES (_farm_id, _uid, 'active');

  -- Seed all 7 predefined roles + worker
  FOR _role IN SELECT * FROM (VALUES
    ('Owner','owner'::app_role),('Farm Manager','farm_manager'::app_role),
    ('Veterinarian','veterinarian'::app_role),('Accountant','accountant'::app_role),
    ('Inventory Manager','inventory_manager'::app_role),('HR Manager','hr_manager'::app_role),
    ('Milker','milker'::app_role),('Worker','worker'::app_role)
  ) AS t(nm, cd) LOOP
    INSERT INTO public.roles (farm_id, name, code, is_system)
    VALUES (_farm_id, _role.nm, _role.cd, true)
    RETURNING id INTO _owner_role_id;
    IF _role.cd = 'owner' THEN
      -- give owner every permission
      INSERT INTO public.role_permissions (role_id, permission_id)
      SELECT _owner_role_id, id FROM public.permissions;
      INSERT INTO public.user_roles (user_id, farm_id, role_id) VALUES (_uid, _farm_id, _owner_role_id);
    END IF;
  END LOOP;

  SELECT id INTO _basic_plan FROM public.plans WHERE code = 'basic' LIMIT 1;
  INSERT INTO public.subscriptions (farm_id, plan_id, status, current_period_end)
  VALUES (_farm_id, _basic_plan, 'trialing', now() + INTERVAL '14 days');

  INSERT INTO public.activity_logs (farm_id, actor_id, entity, entity_id, action, description)
  VALUES (_farm_id, _uid, 'farm', _farm_id, 'created', 'Farm created');

  RETURN _farm_id;
END $$;

GRANT EXECUTE ON FUNCTION public.bootstrap_farm(TEXT,TEXT,TEXT,TEXT) TO authenticated;

-- ============ RPC: accept invitation ============
CREATE OR REPLACE FUNCTION public.accept_invitation(_token TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _inv RECORD; _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _inv FROM public.invitations
    WHERE token = _token AND status = 'pending' AND expires_at > now();
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid or expired invitation'; END IF;

  INSERT INTO public.farm_members (farm_id, user_id, status) VALUES (_inv.farm_id, _uid, 'active')
    ON CONFLICT (farm_id, user_id) DO UPDATE SET status = 'active';

  IF _inv.role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, farm_id, role_id) VALUES (_uid, _inv.farm_id, _inv.role_id)
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.invitations SET status = 'accepted', accepted_at = now() WHERE id = _inv.id;
  RETURN _inv.farm_id;
END $$;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
