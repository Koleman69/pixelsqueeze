-- Function to add a role to a user (admin only)
CREATE OR REPLACE FUNCTION public.add_user_role(target_user_id uuid, target_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can add roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Insert the role (ignore if already exists)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Function to remove a role from a user (admin only)
CREATE OR REPLACE FUNCTION public.remove_user_role(target_user_id uuid, target_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can remove roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Prevent removing your own admin role
  IF target_user_id = auth.uid() AND target_role = 'admin' THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;
  
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;
  
  RETURN true;
END;
$$;

-- Function to get all user roles (admin only)
CREATE OR REPLACE FUNCTION public.get_all_user_roles()
RETURNS TABLE(user_id uuid, role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can view all roles
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT ur.user_id, ur.role
  FROM public.user_roles ur;
END;
$$;