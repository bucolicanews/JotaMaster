import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Settings, Building, KeyRound, Save, Loader2, Globe, Search, Activity,
  BookOpen, Code, Terminal, Workflow, Blocks, Github, ExternalLink, MessageSquareQuote,
  Wrench, Database, Zap, FileText, Sparkles
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';

const UFs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const Configuracao = () => {
  const { autenticado, session } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Variáveis Locais
  const [webhookTestUrl, setWebhookTestUrl] = useState(localStorage.getItem('jota-webhook-test') || '');
  const [webhookProdUrl, setWebhookProdUrl] = useState(localStorage.getItem('jota-webhook-prod') || '');
  const [razaoSocial, setRazaoSocial] = useState(localStorage.getItem('jota-razaoSocial') || '');
  const [cnpj, setCnpj] = useState(localStorage.getItem('jota-cnpj') || '');
  const [uf, setUf] = useState(localStorage.getItem('jota-uf') || 'SP');
  const [contadorNome, setContadorNome] = useState(localStorage.getItem('jota-contador-nome') || '');
  const [contadorCrc, setContadorCrc] = useState(localStorage.getItem('jota-contador-crc') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('jota-gemini-key') || '');
  const [geminiModel, setGeminiModel] = useState(localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash');
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(localStorage.getItem('jota-gemini-search') === 'true');

  useEffect(() => {
    // Ao carregar, tenta buscar a chave de API salva no banco de dados para sincronizar
    const loadProfileData = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('api_key')
          .eq('id', session.user.id)
          .single();
        
        if (data && data.api_key) {
          setGeminiKey(data.api_key);
          localStorage.setItem('jota-gemini-key', data.api_key); // Mantém o cache local atualizado
        }
      }
    };
    loadProfileData();
  }, [session]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Salva tudo localmente (para acesso rápido do frontend)
      localStorage.setItem('jota-razaoSocial', razaoSocial);
      localStorage.setItem('jota-cnpj', cnpj);
      localStorage.setItem('jota-uf', uf);
      localStorage.setItem('jota-webhook-test', webhookTestUrl);
      localStorage.setItem('jota-webhook-prod', webhookProdUrl);
      localStorage.setItem('jota-contador-nome', contadorNome);
      localStorage.setItem('jota-contador-crc', contadorCrc);
      localStorage.setItem('jota-gemini-key', geminiKey);
      localStorage.setItem('jota-gemini-model', geminiModel);
      localStorage.setItem('jota-gemini-search', enableGoogleSearch.toString());

      // 2. Persiste a Chave da API no banco de dados para que o Motor Autônomo (Edge Function) possa usá-la
      if (session?.user) {
        const { error } = await supabase
          .from('profiles')
          .update({ api_key: geminiKey })
          .eq('id', session.user.id);
        
        if (error) {
          console.error("Erro ao salvar chave no perfil:", error);
          toast.warning("Configurações salvas localmente, mas houve erro ao sincronizar a API Key com o servidor.");
          return;
        }
      }

      toast.success("Configurações salvas e sincronizadas com sucesso!");
    } catch (e) {
      toast.error("Falha ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Settings className="h-6 w-6 text-primary" />Configurações do Sistema</CardTitle>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Salvar Configurações
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* 1. DADOS DA EMPRESA E CONTADOR */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-muted/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Building className="h-5 w-5 text-muted-foreground" />Identificação e Responsabilidade</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2"><Label>Razão Social</Label><Input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} /></div>
               <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} /></div>
               <div className="space-y-2"><Label>Estado (UF)</Label><Select value={uf} onValueChange={setUf}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFs.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
               <div className="space-y-2"><Label>Contador Responsável</Label><Input value={contadorNome} onChange={(e) => setContadorNome(e.target.value)} placeholder="Nome completo" /></div>
               <div className="space-y-2"><Label>CRC do Contador</Label><Input value={contadorCrc} onChange={(e) => setContadorCrc(e.target.value)} placeholder="Ex: PA-000000/O" /></div>
             </div>
          </div>

          {/* 2. IA LOCAL */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-blue-50/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" />Configurações da IA (Gemini)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label>Gemini API Key</Label>
                 <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
                 <p className="text-[10px] text-muted-foreground">Esta chave será usada para o Chat e para os Agentes Autônomos em background.</p>
               </div>
               <div className="space-y-2">
                 <Label>Modelo</Label>
                 <Select value={geminiModel} onValueChange={setGeminiModel}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro</SelectItem>
                     <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                     <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label className="flex items-center gap-2"><Search className="h-4 w-4 text-blue-500" /> Grounding</Label>
                 <div className="flex items-center justify-between p-2 border border-blue-500/30 rounded bg-blue-500/10">
                   <span className="text-xs text-blue-800">Pesquisa na internet</span>
                   <Switch checked={enableGoogleSearch} onCheckedChange={setEnableGoogleSearch} />
                 </div>
               </div>
             </div>
          </div>

          {/* 3. WEBHOOKS */}
          <div className="space-y-6 rounded-lg border border-border p-6 bg-muted/5">
             <h3 className="text-lg font-semibold flex items-center gap-2"><Globe className="h-5 w-5 text-muted-foreground" />Integrações Externas (n8n)</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2"><Label>Webhook Ambiente Teste</Label><Input value={webhookTestUrl} onChange={(e) => setWebhookTestUrl(e.target.value)} placeholder="https://..." /></div>
               <div className="space-y-2"><Label>Webhook Ambiente Produção</Label><Input value={webhookProdUrl} onChange={(e) => setWebhookProdUrl(e.target.value)} placeholder="https://..." /></div>
             </div>
          </div>

          {/* 4. MANUAIS DE GOVERNANÇA */}
          <div className="space-y-6 rounded-lg border border-indigo-500/20 p-6 bg-indigo-500/5">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-600">
              <BookOpen className="h-5 w-5" /> Guias de Desenvolvimento e Governança
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="community">
                <AccordionTrigger className="text-sm font-bold text-primary"><Github className="h-4 w-4 mr-2" /> Repositórios da Comunidade</AccordionTrigger>
                <AccordionContent className="text-xs space-y-4 p-4 bg-primary/5 rounded-md border border-primary/10">
                  <p className="font-bold">Baixe inteligências prontas e importe no seu sistema:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="https://github.com/bucolicanews/prompts" target="_blank" className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-2">
                        <MessageSquareQuote className="h-4 w-4 text-indigo-500" />
                        <span>Biblioteca de Prompts</span>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                    <a href="https://github.com/bucolicanews/Skills" target="_blank" className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary transition-colors">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-emerald-500" />
                        <span>Biblioteca de Skills</span>
                      </div>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </div>
                  <p className="text-muted-foreground italic">Dica: Baixe o arquivo .json do repositório e use o botão "Importar" na página correspondente.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="skills">
                <AccordionTrigger className="text-sm font-bold"><Code className="h-4 w-4 mr-2" /> Como construir uma Skill</AccordionTrigger>
                <AccordionContent className="text-xs space-y-6 text-muted-foreground leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">O que são Skills?</p>
                    <p>As Skills são funções JavaScript assíncronas executadas no contexto do Master. Elas permitem que a IA interaja com o mundo real, consulte bancos de dados e APIs externas.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Estrutura do JSON para Importação:</p>
                    <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                      <code className="text-blue-400 font-mono block whitespace-pre">
{`[
  {
    "name": "nome_da_skill",
    "description": "O que ela faz",
    "parameters": { "type": "object", "properties": {} },
    "executionType": "local_js",
    "jsCode": "return { status: 'ok' };"
  }
]`}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Objetos Disponíveis no Escopo:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><code className="text-primary">args</code>: Parâmetros extraídos pela IA.</li>
                      <li><code className="text-primary">helpers</code>: Funções nativas (Simples Nacional, NCM).</li>
                      <li><code className="text-primary">supabase</code>: Cliente oficial para ler/gravar dados.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-foreground border-b pb-1">Exemplos Práticos por Tipo:</p>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1"><Database className="h-3 w-3" /> 1. JS Local: Busca no Supabase</p>
                      <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                        <code className="text-emerald-500 font-mono block whitespace-pre">
{`// Busca cliente por CPF ou CNPJ
const { data, error } = await supabase
  .from('crm_clientes')
  .select('*')
  .eq('documento', args.documento)
  .single();

if (error) return { status: 'erro', msg: error.message };
return { status: 'ok', cliente: data };`}
                        </code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1"><Zap className="h-3 w-3" /> 2. Webhook: Enviar JSON para n8n</p>
                      <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                        <p className="text-blue-300 font-mono text-[9px] mb-2">Webhook URL: https://n8n.seu-servidor.com/webhook/...</p>
                        <code className="text-emerald-500 font-mono block whitespace-pre">
{`// A IA envia os dados estruturados (JSON) para o n8n.
// O n8n pode então gerar um PDF ou enviar e-mail.`}
                        </code>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="prompts">
                <AccordionTrigger className="text-sm font-bold"><Terminal className="h-4 w-4 mr-2" /> Como construir um Prompt (Personas)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-6 text-muted-foreground leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">O que são Prompts?</p>
                    <p>Prompts definem a Persona (Papel) e as Instruções de Sistema. Eles ensinam a IA como ela deve agir e quais dados do cliente ela deve priorizar.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Estrutura do JSON para Importação:</p>
                    <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                      <code className="text-blue-400 font-mono block whitespace-pre">
{`[
  {
    "title": "Nome do Especialista",
    "role": "Persona (ex: Consultor Tributário)",
    "content": "Instruções detalhadas de comportamento..."
  }
]`}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                    <p className="font-bold text-primary flex items-center gap-2"><Database className="h-4 w-4" /> Variáveis de Contexto (O Poder da Placa-mãe)</p>
                    <p>Use o símbolo <strong>@</strong> para injetar dados reais do cliente no prompt. A IA substituirá automaticamente pelos valores atuais.</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 font-mono text-[10px]">
                      <li><code className="text-indigo-600">@empresa.razaoSocial</code></li>
                      <li><code className="text-indigo-600">@empresa.classificacaoFiscal</code></li>
                      <li><code className="text-indigo-600">@financeiro.faturamento.anual_total</code></li>
                      <li><code className="text-indigo-600">@financeiro.fator_r.percentual_atual</code></li>
                      <li><code className="text-indigo-600">@operacional.cnaes</code></li>
                      <li><code className="text-indigo-600">@operacional.descricaoAtividades</code></li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <p className="font-bold text-foreground border-b pb-1">Exemplos Práticos de Especialistas:</p>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1"><MessageSquareQuote className="h-3 w-3" /> 1. Especialista em Simples Nacional</p>
                      <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                        <code className="text-blue-300 font-mono block whitespace-pre">
{`Você é o Especialista em Simples Nacional da JOTA.
Analise a empresa @empresa.razaoSocial.
Ela é uma @empresa.classificacaoFiscal com faturamento de @financeiro.faturamento.anual_total.
Seu foco é validar se o Fator R (@financeiro.fator_r.percentual_atual) permite a migração para o Anexo III.`}
                        </code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-indigo-600 flex items-center gap-1"><Sparkles className="h-3 w-3" /> 2. Analista de Novos Negócios</p>
                      <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                        <code className="text-blue-300 font-mono block whitespace-pre">
{`Você é o Analista de Viabilidade.
O cliente quer abrir um negócio com os seguintes CNAEs: @operacional.cnaes.
A descrição das atividades é: @operacional.descricaoAtividades.
Verifique se existe algum impedimento legal para o Simples Nacional.`}
                        </code>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="agents">
                <AccordionTrigger className="text-sm font-bold"><Workflow className="h-4 w-4 mr-2" /> Como construir um Agente (Workflows)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">O que são Agentes?</p>
                    <p>Agentes são orquestradores. Eles não apenas respondem, eles executam uma sequência de tarefas (cadeia de raciocínio) usando as Skills disponíveis.</p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Estrutura do JSON para Importação:</p>
                    <div className="bg-slate-950 p-3 rounded-md border border-white/10">
                      <code className="text-blue-400 font-mono block whitespace-pre">
{`[
  {
    "nome": "Nome do Agente",
    "systemPrompt": "Instruções de orquestração...",
    "order": 1,
    "useN8n": false,
    "n8nResponseUrl": "URL para retorno assíncrono"
  }
]`}
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                    <p className="font-bold text-orange-700 flex items-center gap-2"><Zap className="h-4 w-4" /> Integração com n8n (Modo Assíncrono)</p>
                    <p>Para processos pesados (ex: gerar um relatório de 20 páginas), ative o <strong>Modo n8n</strong>. O Agente enviará os dados para o seu workflow e aguardará a resposta na URL configurada.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="marketplace">
                <AccordionTrigger className="text-sm font-bold"><Blocks className="h-4 w-4 mr-2" /> Como construir um Módulo (Marketplace)</AccordionTrigger>
                <AccordionContent className="text-xs space-y-2 text-muted-foreground leading-relaxed">
                  <p>Módulos são Micro-frontends independentes que se acoplam à Placa-mãe JOTA.</p>
                  <ol className="list-decimal pl-4 space-y-2">
                    <li><strong>Desenvolvimento:</strong> Crie seu App em React/Vite e hospede em uma CDN segura (HTTPS).</li>
                    <li><strong>Manifesto:</strong> Crie um arquivo <strong>ai-manifest.json</strong> na raiz do seu projeto detalhando as Skills e Agentes que seu módulo oferece.</li>
                    <li><strong>Integração:</strong> Cadastre a URL no Painel Admin como tipo <strong>iframe</strong>.</li>
                  </ol>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="font-bold text-blue-700 flex items-center gap-2"><FileText className="h-4 w-4" /> Manual Completo do Desenvolvedor</p>
                    <p className="text-[10px] mt-1">
                      Consulte o guia passo a passo de integração no GitHub: 
                      <a 
                        href="https://github.com/bucolicanews/JotaMaster/blob/main/docs/15-GUIA_DESENVOLVEDOR_MODULOS.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-1 font-bold"
                      >
                        docs/15-GUIA_DESENVOLVEDOR_MODULOS.md
                      </a>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="pt-6 border-t border-border">
            <Button type="button" size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90" onClick={handleSave}>
              <Save className="h-5 w-5 mr-2" /> Confirmar e Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracao;