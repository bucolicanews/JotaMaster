-- 1. TABELA DE PERFIS (TENANTS)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2. TABELA DE MÓDULOS INSTALADOS
CREATE TABLE public.installed_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.installed_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_select_policy" ON public.installed_modules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "modules_insert_policy" ON public.installed_modules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "modules_update_policy" ON public.installed_modules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "modules_delete_policy" ON public.installed_modules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. GATILHO AUTOMÁTICO PARA CRIAÇÃO DE PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, company_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();