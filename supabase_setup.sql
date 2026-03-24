-- =====================================================
-- 1. EXTENSÕES E FUNÇÕES AUXILIARES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 2. TABELAS CORE (PLACA-MÃE)
-- =====================================================

-- Perfis de Usuário (Extensão do Auth.Users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    role TEXT DEFAULT 'empresa' CHECK (role IN ('admin', 'vendedor', 'empresa')),
    plan TEXT DEFAULT 'trial',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo de Módulos (Marketplace)
CREATE TABLE public.system_modules (
    id TEXT PRIMARY KEY, -- ex: 'crm', 'skills', 'audit'
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Blocks',
    price NUMERIC(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    is_native BOOLEAN DEFAULT false,
    module_type TEXT DEFAULT 'internal' CHECK (module_type IN ('internal', 'iframe')),
    bundle_url TEXT, -- URL da CDN para Micro-frontends
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Módulos Instalados por Locatário
CREATE TABLE public.installed_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT REFERENCES public.system_modules(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

-- =====================================================
-- 3. TABELAS DE INTELIGÊNCIA (AI ECOSYSTEM)
-- =====================================================

-- Skills (Ferramentas da IA)
CREATE TABLE public.ai_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT REFERENCES public.system_modules(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    suggested_instruction TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    execution_type TEXT DEFAULT 'local_js' CHECK (execution_type IN ('local_js', 'webhook', 'knowledge_base', 'web_scraping')),
    js_code TEXT,
    webhook_url TEXT,
    knowledge_base_text TEXT,
    url TEXT,
    selector TEXT,
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false, -- Se true, todos os usuários veem
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agentes Autônomos
CREATE TABLE public.ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT REFERENCES public.system_modules(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    system_prompt TEXT,
    order_index INTEGER DEFAULT 0,
    selected_skills JSONB DEFAULT '[]'::jsonb,
    enable_monitoring BOOLEAN DEFAULT false,
    monitoring_interval INTEGER DEFAULT 60,
    use_n8n BOOLEAN DEFAULT false,
    n8n_response_url TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biblioteca de Prompts (Personas)
CREATE TABLE public.ai_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT REFERENCES public.system_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    role TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
CREATE POLICY "Usuários veem seu próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id OR get_user_role() = 'admin');
CREATE POLICY "Admins gerenciam perfis" ON public.profiles FOR ALL USING (get_user_role() = 'admin');

-- Políticas para SYSTEM_MODULES
CREATE POLICY "Todos veem módulos ativos" ON public.system_modules FOR SELECT USING (is_active = true OR get_user_role() = 'admin');
CREATE POLICY "Admins gerenciam catálogo" ON public.system_modules FOR ALL USING (get_user_role() = 'admin');

-- Políticas para INSTALLED_MODULES
CREATE POLICY "Usuários veem seus módulos" ON public.installed_modules FOR SELECT USING (auth.uid() = user_id OR get_user_role() = 'admin');
CREATE POLICY "Usuários instalam módulos grátis" ON public.installed_modules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins gerenciam instalações" ON public.installed_modules FOR ALL USING (get_user_role() = 'admin');

-- Políticas para IA (Skills, Agents, Prompts) - Padrão Global/Dono
CREATE POLICY "Leitura IA" ON public.ai_skills FOR SELECT USING (auth.uid() = user_id OR is_global = true OR get_user_role() = 'admin');
CREATE POLICY "Escrita IA" ON public.ai_skills FOR ALL USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Leitura Agentes" ON public.ai_agents FOR SELECT USING (auth.uid() = user_id OR is_global = true OR get_user_role() = 'admin');
CREATE POLICY "Escrita Agentes" ON public.ai_agents FOR ALL USING (auth.uid() = user_id OR get_user_role() = 'admin');

CREATE POLICY "Leitura Prompts" ON public.ai_prompts FOR SELECT USING (auth.uid() = user_id OR is_global = true OR get_user_role() = 'admin');
CREATE POLICY "Escrita Prompts" ON public.ai_prompts FOR ALL USING (auth.uid() = user_id OR get_user_role() = 'admin');

-- =====================================================
-- 5. AUTOMAÇÕES (TRIGGERS)
-- =====================================================

-- Criar perfil automaticamente ao cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, company_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    COALESCE(new.raw_user_meta_data ->> 'role', 'empresa')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. DADOS INICIAIS (SEED)
-- =====================================================
INSERT INTO public.system_modules (id, name, description, icon, price, is_native) VALUES
('skills', 'Módulo de Skills', 'Habilita ferramentas personalizadas para a IA.', 'Wrench', 0.00, true),
('agents', 'Módulo de Agentes', 'Criação de workflows autônomos.', 'Zap', 0.00, true),
('crm', 'Controle de Clientes', 'Gestão completa de carteira e contratos.', 'Users', 0.00, false);