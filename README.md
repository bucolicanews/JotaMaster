<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JOTA Master - Documentação Inteligente</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@0.321.0/font/lucide.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --primary: #f97316;
            --primary-dark: #ea580c;
            --bg-dark: #0f172a;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
        }

        .glass {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .hero-gradient {
            background: radial-gradient(circle at top right, rgba(249, 115, 22, 0.15), transparent),
                        radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.05), transparent);
        }

        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
        }

        .code-block {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1.5rem;
            border-radius: 0.75rem;
            font-family: 'Fira Code', monospace;
            font-size: 0.875rem;
            overflow-x: auto;
        }

        .nav-link {
            position: relative;
            transition: color 0.3s;
        }

        .nav-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: -4px;
            left: 0;
            background-color: var(--primary);
            transition: width 0.3s;
        }

        .nav-link:hover::after {
            width: 100%;
        }

        .sidebar-active {
            border-right: 4px solid var(--primary);
            background: linear-gradient(to right, rgba(249, 115, 22, 0.1), transparent);
        }
    </style>
</head>
<body class="hero-gradient">

    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 glass border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center gap-2">
                    <div class="bg-orange-500 p-1.5 rounded-lg">
                        <i class="lucide-zap text-white w-6 h-6"></i>
                    </div>
                    <span class="text-xl font-extrabold tracking-tighter text-slate-900">JOTA <span class="text-orange-500 text-sm font-medium">MASTER</span></span>
                </div>
                <div class="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
                    <a href="#visao-geral" class="nav-link hover:text-orange-500">Visão Geral</a>
                    <a href="#tecnologias" class="nav-link hover:text-orange-500">Tecnologias</a>
                    <a href="#funcionalidades" class="nav-link hover:text-orange-500">Módulos</a>
                    <a href="#arquitetura" class="nav-link hover:text-orange-500">Arquitetura</a>
                    <a href="#instalacao" class="nav-link hover:text-orange-500">Instalação</a>
                </div>
                <div>
                    <a href="#instalacao" class="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-orange-500 transition-all shadow-lg shadow-slate-200">
                        Deploy Now
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="flex pt-16">
        <!-- Sidebar (Desktop) -->
        <aside class="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-200 p-6 overflow-y-auto">
            <div class="space-y-8">
                <div>
                    <h4 class="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Documentação</h4>
                    <ul class="space-y-3 text-sm">
                        <li><a href="#visao-geral" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-book-open w-4 h-4"></i> Introdução</a></li>
                        <li><a href="#tecnologias" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-cpu w-4 h-4"></i> Stack Técnica</a></li>
                        <li><a href="#funcionalidades" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-layers w-4 h-4"></i> Módulos & Plugins.</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-4">Desenvolvimento</h4>
                    <ul class="space-y-3 text-sm">
                        <li><a href="#arquitetura" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-git-branch w-4 h-4"></i> Estrutura de Pastas</a></li>
                        <li><a href="#instalacao" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-terminal w-4 h-4"></i> Guia de Instalação</a></li>
                        <li><a href="#roadmap" class="text-slate-600 hover:text-orange-500 flex items-center gap-2"><i class="lucide-milestone w-4 h-4"></i> Roadmap 2025</a></li>
                    </ul>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 px-6 py-12 lg:px-16 max-w-5xl mx-auto">
            
            <!-- Hero Section -->
            <section id="hero" class="mb-24 text-center lg:text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase tracking-wider mb-6">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    v1.0.0 Stable Release
                </div>
                <h1 class="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
                    A Placa-mãe da <span class="text-orange-500">Inteligência Fiscal.</span>
                </h1>
                <p class="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
                    O JOTA Master é um ecossistema SaaS modular projetado para orquestrar precificação complexa, viabilidade de negócios e agentes de IA autônomos sob a nova Reforma Tributária Brasileira.
                </p>
                <div class="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <a href="#funcionalidades" class="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 flex items-center gap-2">
                        Explorar Módulos <i class="lucide-arrow-right w-5 h-5"></i>
                    </a>
                    <a href="#arquitetura" class="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                        Ver Arquitetura <i class="lucide-layout w-5 h-5"></i>
                    </a>
                </div>
            </section>

            <!-- Visão Geral -->
            <section id="visao-geral" class="mb-32 scroll-mt-24">
                <div class="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 class="text-3xl font-bold text-slate-900 mb-6">O Problema que Resolvemos</h2>
                        <p class="text-slate-600 mb-6 leading-relaxed">
                            A complexidade tributária brasileira, agravada pela transição para a <strong>Lei Complementar 214/2025 (IBS/CBS)</strong>, exige ferramentas que não apenas calculem, mas que pensem estrategicamente.
                        </p>
                        <div class="space-y-4">
                            <div class="flex gap-4">
                                <div class="bg-green-100 p-2 rounded-lg h-fit"><i class="lucide-check text-green-600 w-5 h-5"></i></div>
                                <div>
                                    <h4 class="font-bold text-slate-900">Fim da Bitributação</h4>
                                    <p class="text-sm text-slate-500">Auditoria automática de CST/CSOSN para evitar pagamentos indevidos.</p>
                                </div>
                            </div>
                            <div class="flex gap-4">
                                <div class="bg-green-100 p-2 rounded-lg h-fit"><i class="lucide-check text-green-600 w-5 h-5"></i></div>
                                <div>
                                    <h4 class="font-bold text-slate-900">Simulação de Reforma</h4>
                                    <p class="text-sm text-slate-500">Cálculo em tempo real do impacto do IVA no preço de venda.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <i class="lucide-shield-check w-48 h-48 text-white"></i>
                        </div>
                        <div class="relative z-10">
                            <div class="text-orange-500 font-mono text-xs mb-4">// Intelligence Core</div>
                            <h3 class="text-white text-2xl font-bold mb-4">Segurança & Governança</h3>
                            <p class="text-slate-400 text-sm mb-6">
                                Implementamos <strong>Row Level Security (RLS)</strong> nativo via Supabase, garantindo isolamento total de dados entre locatários (Multi-tenant).
                            </p>
                            <div class="flex gap-2">
                                <span class="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">Zero Trust</span>
                                <span class="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">RBAC</span>
                                <span class="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">AES-256</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tecnologias -->
            <section id="tecnologias" class="mb-32 scroll-mt-24">
                <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">Stack Tecnológica de Elite</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div class="glass p-6 rounded-2xl text-center card-hover">
                        <div class="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <i class="lucide-atom text-blue-500 w-6 h-6"></i>
                        </div>
                        <h4 class="font-bold text-sm">React + Vite</h4>
                        <p class="text-[10px] text-slate-500 mt-2">Interface ultra-rápida e reativa.</p>
                    </div>
                    <div class="glass p-6 rounded-2xl text-center card-hover">
                        <div class="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <i class="lucide-database text-emerald-500 w-6 h-6"></i>
                        </div>
                        <h4 class="font-bold text-sm">Supabase</h4>
                        <p class="text-[10px] text-slate-500 mt-2">Backend as a Service & Auth.</p>
                    </div>
                    <div class="glass p-6 rounded-2xl text-center card-hover">
                        <div class="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <i class="lucide-brain-circuit text-purple-500 w-6 h-6"></i>
                        </div>
                        <h4 class="font-bold text-sm">Gemini 2.0</h4>
                        <p class="text-[10px] text-slate-500 mt-2">O cérebro por trás dos agentes.</p>
                    </div>
                    <div class="glass p-6 rounded-2xl text-center card-hover">
                        <div class="bg-orange-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <i class="lucide-wind text-orange-500 w-6 h-6"></i>
                        </div>
                        <h4 class="font-bold text-sm">Tailwind CSS</h4>
                        <p class="text-[10px] text-slate-500 mt-2">Design atômico e elegante.</p>
                    </div>
                </div>
            </section>

            <!-- Funcionalidades -->
            <section id="funcionalidades" class="mb-32 scroll-mt-24">
                <div class="flex items-center justify-between mb-12">
                    <h2 class="text-3xl font-bold text-slate-900">Módulos do Ecossistema</h2>
                    <span class="text-sm text-orange-500 font-bold">Motherboard Architecture</span>
                </div>
                
                <div class="space-y-6">
                    <!-- Módulo 1 -->
                    <div class="glass p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-8 items-start card-hover">
                        <div class="bg-orange-500 p-4 rounded-2xl shadow-lg shadow-orange-200">
                            <i class="lucide-calculator text-white w-8 h-8"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-xl font-bold text-slate-900">Precificação Inteligente</h3>
                                <span class="px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-bold">CORE</span>
                            </div>
                            <p class="text-slate-600 text-sm mb-4">
                                Motor de cálculo que processa XMLs de NFe e aplica Markup Divisor considerando créditos de IVA (IBS/CBS), despesas fixas rateadas (CFU) e margem líquida alvo.
                            </p>
                            <ul class="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <li class="flex items-center gap-2"><i class="lucide-check-circle-2 w-3 h-3 text-orange-500"></i> Importação XML em Lote</li>
                                <li class="flex items-center gap-2"><i class="lucide-check-circle-2 w-3 h-3 text-orange-500"></i> Cálculo de CUMP</li>
                                <li class="flex items-center gap-2"><i class="lucide-check-circle-2 w-3 h-3 text-orange-500"></i> Relatórios PDF Gerenciais</li>
                                <li class="flex items-center gap-2"><i class="lucide-check-circle-2 w-3 h-3 text-orange-500"></i> Simulação de Cenários</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Módulo 2 -->
                    <div class="glass p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-8 items-start card-hover">
                        <div class="bg-indigo-500 p-4 rounded-2xl shadow-lg shadow-indigo-200">
                            <i class="lucide-bot text-white w-8 h-8"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-xl font-bold text-slate-900">AI Orchestrator</h3>
                                <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[10px] font-bold">PREMIUM</span>
                            </div>
                            <p class="text-slate-600 text-sm mb-4">
                                Gestão de Agentes, Skills e Prompts. Permite que a IA execute código JavaScript local, consulte APIs externas via Webhooks e utilize Grounding do Google Search.
                            </p>
                            <div class="flex gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-indigo-600">@</div>
                                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Skills</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-indigo-600">#</div>
                                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Agentes</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-indigo-600">/</div>
                                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Prompts</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Módulo 3 -->
                    <div class="glass p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row gap-8 items-start card-hover opacity-75">
                        <div class="bg-slate-400 p-4 rounded-2xl shadow-lg shadow-slate-200">
                            <i class="lucide-blocks text-white w-8 h-8"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-xl font-bold text-slate-900">Marketplace de Artefatos</h3>
                                <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">BETA</span>
                            </div>
                            <p class="text-slate-600 text-sm mb-4">
                                Arquitetura de Micro-frontends que permite injetar aplicações externas via Iframe Sandboxado, sincronizando inteligência via <code>ai-manifest.json</code>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Arquitetura -->
            <section id="arquitetura" class="mb-32 scroll-mt-24">
                <h2 class="text-3xl font-bold text-slate-900 mb-8">Estrutura do Projeto</h2>
                <div class="code-block">
<pre>
jota-master/
├── src/
│   ├── components/       <span class="text-orange-400"># Componentes UI (Shadcn)</span>
│   │   ├── summary/      <span class="text-slate-500"># Cards de resumo financeiro</span>
│   │   └── ui/           <span class="text-slate-500"># Primitivos de design</span>
│   ├── contexts/         <span class="text-orange-400"># Auth & Global States</span>
│   ├── integrations/     <span class="text-orange-400"># Supabase Client</span>
│   ├── lib/              <span class="text-orange-400"># Motores Lógicos</span>
│   │   ├── pricing.ts    <span class="text-slate-500"># Algoritmo de Precificação</span>
│   │   ├── gemini.ts     <span class="text-slate-500"># Orquestrador de IA</span>
│   │   └── tax/          <span class="text-slate-500"># Tabelas NCM/CST/INSS</span>
│   ├── pages/            <span class="text-orange-400"># Views Principais</span>
│   └── types/            <span class="text-orange-400"># Definições TypeScript</span>
├── docs/                 <span class="text-orange-400"># Documentação Técnica (.md)</span>
└── supabase/             <span class="text-orange-400"># Migrations & Edge Functions</span>
</pre>
                </div>
            </section>

            <!-- Instalação -->
            <section id="instalacao" class="mb-32 scroll-mt-24">
                <h2 class="text-3xl font-bold text-slate-900 mb-8">Guia de Instalação</h2>
                <div class="space-y-6">
                    <div class="step">
                        <h4 class="font-bold text-slate-900 mb-2">1. Clonar e Instalar</h4>
                        <div class="code-block">
                            git clone https://github.com/jota/master.git<br>
                            cd jota-master<br>
                            npm install
                        </div>
                    </div>
                    <div class="step">
                        <h4 class="font-bold text-slate-900 mb-2">2. Variáveis de Ambiente</h4>
                        <p class="text-sm text-slate-500 mb-2">Crie um arquivo <code>.env</code> na raiz:</p>
                        <div class="code-block">
                            VITE_SUPABASE_URL=sua_url<br>
                            VITE_SUPABASE_ANON_KEY=sua_chave
                        </div>
                    </div>
                    <div class="step">
                        <h4 class="font-bold text-slate-900 mb-2">3. Iniciar Desenvolvimento</h4>
                        <div class="code-block">
                            npm run dev
                        </div>
                    </div>
                    <!-- PASSO 4: DATABASE SETUP -->
                    <div class="step">
                        <h4 class="font-bold text-slate-900 mb-2">4. Configuração do Banco de Dados (Supabase)</h4>
                        <p class="text-sm text-slate-500 mb-4">Execute o script abaixo no <strong>SQL Editor</strong> do seu projeto Supabase para criar a estrutura básica necessária para o sistema grátis:</p>
                        <div class="code-block">
<pre>
-- 1. FUNÇÕES DE AUXÍLIO
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'empresa',
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid() OR get_user_role() = 'admin');

-- 3. CATÁLOGO DE MÓDULOS (SYSTEM_MODULES)
CREATE TABLE public.system_modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Blocks',
  price NUMERIC DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  is_native BOOLEAN DEFAULT false,
  bundle_url TEXT,
  module_type TEXT DEFAULT 'internal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active modules" ON public.system_modules 
FOR SELECT USING (is_active = true OR get_user_role() = 'admin');

-- 4. MÓDULOS INSTALADOS (INSTALLED_MODULES)
CREATE TABLE public.installed_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT REFERENCES public.system_modules(id),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.installed_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_select_policy" ON public.installed_modules
FOR SELECT TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'admin');

CREATE POLICY "modules_insert_policy" ON public.installed_modules
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "modules_delete_policy" ON public.installed_modules
FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 5. INTELIGÊNCIA: PROMPTS
CREATE TABLE public.ai_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT,
  title TEXT NOT NULL,
  role TEXT,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura_Prompts_Global" ON public.ai_prompts
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_global = true OR get_user_role() = 'admin');

CREATE POLICY "Modificar Prompts" ON public.ai_prompts
FOR ALL TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- 6. INTELIGÊNCIA: SKILLS
CREATE TABLE public.ai_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT,
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
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura_Skills_Global" ON public.ai_skills
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_global = true OR get_user_role() = 'admin');

CREATE POLICY "Modificar Skills" ON public.ai_skills
FOR ALL TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- 7. INTELIGÊNCIA: AGENTES
CREATE TABLE public.ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura_Agents_Global" ON public.ai_agents
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_global = true OR get_user_role() = 'admin');

CREATE POLICY "Modificar Agents" ON public.ai_agents
FOR ALL TO authenticated USING (user_id = auth.uid() OR get_user_role() = 'admin');

-- 8. AUTOMAÇÃO DE PERFIL NO SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. DADOS INICIAIS (SEED) - OBRIGATÓRIO PARA O MARKETPLACE FUNCIONAR
INSERT INTO public.system_modules (id, name, description, icon, price, is_active, is_native, module_type)
VALUES 
('skills', 'Módulo de Skills', 'Habilita o uso de ferramentas e funções personalizadas pela IA.', 'Wrench', 0.00, true, true, 'internal'),
('agents', 'Módulo de Agentes', 'Habilita a criação e execução de agentes autônomos e workflows.', 'Zap', 0.00, true, true, 'internal')
ON CONFLICT (id) DO UPDATE SET is_active = true;
</pre>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Roadmap -->
            <section id="roadmap" class="mb-32 scroll-mt-24">
                <h2 class="text-3xl font-bold text-slate-900 mb-12">Roadmap 2025</h2>
                <div class="relative border-l-2 border-slate-200 ml-4 space-y-12">
                    <div class="relative pl-8">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-white"></div>
                        <h4 class="font-bold text-slate-900">Q1 - Lançamento do Marketplace</h4>
                        <p class="text-sm text-slate-500">Suporte total a Micro-frontends externos e injeção de Skills via CDN.</p>
                    </div>
                    <div class="relative pl-8">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                        <h4 class="font-bold text-slate-900">Q2 - Integração Bancária (Open Finance)</h4>
                        <p class="text-sm text-slate-500">Conciliação automática de fluxo de caixa com previsões de IA.</p>
                    </div>
                    <div class="relative pl-8">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"></div>
                        <h4 class="font-bold text-slate-900">Q3 - JOTA Mobile App</h4>
                        <p class="text-sm text-slate-500">Versão nativa iOS/Android para consultas rápidas e alertas fiscais.</p>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="border-t border-slate-200 pt-12 text-center">
                <div class="flex justify-center gap-6 mb-8">
                    <a href="#" class="text-slate-400 hover:text-orange-500"><i class="lucide-github w-6 h-6"></i></a>
                    <a href="#" class="text-slate-400 hover:text-orange-500"><i class="lucide-linkedin w-6 h-6"></i></a>
                    <a href="#" class="text-slate-400 hover:text-orange-500"><i class="lucide-globe w-6 h-6"></i></a>
                </div>
                <p class="text-sm text-slate-500">
                    &copy; 2024 JOTA Contabilidade e Inteligência. Todos os direitos reservados.<br>
                    <span class="text-[10px] uppercase tracking-widest font-bold mt-2 block">Built with Passion & AI</span>
                </p>
            </footer>

        </main>
    </div>

    <script>
        // Simple scroll spy for sidebar (optional enhancement)
        window.addEventListener('scroll', () => {
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.sidebar-link');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });
        });
    </script>
</body>
</html>