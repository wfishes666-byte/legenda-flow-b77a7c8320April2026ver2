-- Table to store per-role menu visibility
CREATE TABLE IF NOT EXISTS public.role_menu_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  menu_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (role, menu_key)
);

ALTER TABLE public.role_menu_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read (sidebar needs it)
CREATE POLICY "Authenticated can view role menu permissions"
ON public.role_menu_permissions
FOR SELECT
TO authenticated
USING (true);

-- Admin full access
CREATE POLICY "Admin full access role_menu_permissions"
ON public.role_menu_permissions
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Management full access
CREATE POLICY "Management full access role_menu_permissions"
ON public.role_menu_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'management'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'management'::public.app_role));

-- Update user_roles policies to allow management to manage roles
DROP POLICY IF EXISTS "Management can manage roles" ON public.user_roles;
CREATE POLICY "Management can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'management'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'management'::public.app_role));

-- Trigger to maintain updated_at
CREATE TRIGGER update_role_menu_permissions_updated_at
BEFORE UPDATE ON public.role_menu_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();