-- ====================================================================================
-- ARQUITETURA MULTI-AGENT: TABELAS DE INTELIGÊNCIA DISTRIBUÍDA
-- Este script cria as tabelas para armazenar Skills, Agentes e Prompts no Banco de Dados
-- ====================================================================================

-- 1. TABELA DE SKILLS (FERRAMENTAS)
CREATE TABLE public.ai_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT, -- Indica se a skill veio de um módulo (ex: 'crm'). Nulo = criada manualmente.
    name TEXT NOT NULL,
    description TEXT,
    suggested_instruction TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    execution_type TEXT DEFAULT 'local_js',
    js_code TEXT,
    webhook_url TEXT,
    knowledge_base_text TEXT,
    url TEXT,
    selector TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE AGENTES
CREATE TABLE public.ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PROMPTS (BIBLIOTECA)
CREATE TABLE public.ai_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id TEXT,
    title TEXT NOT NULL,
    role TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- HABILITAR RLS (ROW LEVEL SECURITY)
-- ==========================================
ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (ISOLAMENTO DE TENANT)
-- ==========================================

-- Skills
CREATE POLICY "Isolamento Total Skills" ON public.ai_skills
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agents
CREATE POLICY "Isolamento Total Agents" ON public.ai_agents
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prompts
CREATE POLICY "Isolamento Total Prompts" ON public.ai_prompts
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);