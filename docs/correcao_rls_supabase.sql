-- 1. Apagar TODAS as politicas que podem gerar conflito (antigas e novas)
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

DROP POLICY IF EXISTS "modules_select_policy" ON public.installed_modules;
DROP POLICY IF EXISTS "modules_update_policy" ON public.installed_modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.installed_modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON public.installed_modules;

-- 2. Criar a funcao segura (SECURITY DEFINER) para quebrar o loop de recursao
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Recriar politicas unificadas e definitivas para PROFILES
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.get_user_role() = 'admin');

-- 4. Recriar politicas unificadas e definitivas para MÓDULOS
CREATE POLICY "modules_select_policy" ON public.installed_modules
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY "modules_update_policy" ON public.installed_modules
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.get_user_role() = 'admin');