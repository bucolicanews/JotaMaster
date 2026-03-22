import { supabase } from '@/integrations/supabase/client';
import { JOTA_TOOLS_MANIFEST, DynamicSkill, executeSkill } from "./skills/taxSkills";

export interface AgentStatus {
  id: string;
  nome: string;
  systemPrompt: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  report: string | null;
  errorMessage?: string;
}

export interface AgentConfig {
  id: string;
  nome: string;
  systemPrompt: string;
  webhookUrl?: string;
  order?: number;
  selectedSkills?: string[]; 
  enableMonitoring?: boolean;
  monitoringInterval?: number; 
  useN8n?: boolean;
  n8nResponseUrl?: string;
  moduleId?: string;
  isGlobal?: boolean;
  userId?: string;
}

export interface PromptConfig {
  id: string;
  title: string;
  role: string;
  content: string;
  isActive: boolean;
  moduleId?: string;
  isGlobal?: boolean;
  userId?: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'function';
  parts: any[];
}

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Perito Tributário Sênior da Jota Contabilidade. Sua missão é entregar um MANUAL DE ESTRUTURAÇÃO FISCAL E VIABILIDADE (Nível 10/10).

INICIE COM: “Parecer técnico-contábil estratégico, com visão preventiva, fiscalizatória, pericial e de planejamento tributário estruturado”

INSTRUÇÃO DE INÍCIO: Comece com "RELATÓRIO DE VIABILIDADE TÉCNICA".`;

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Perito Tributário Sênior',
    systemPrompt: 'Você é o Perito Tributário Sênior da Jota Contabilidade. Sua missão é realizar auditorias profundas e encontrar economias fiscais. Utilize a skill #comparar_regimes_tributarios para validações matemáticas.',
    order: 1,
    useN8n: false,
    n8nResponseUrl: 'http://localhost:3001/agent-result'
  }
];

export const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Viabilidade e Estruturação (Padrão JOTA)',
    role: 'Perito Tributário Sênior',
    content: DEFAULT_PRE_ANALYSIS_PROMPT,
    isActive: true
  }
];

// Busca do Banco de Dados
export async function fetchDbAgents(userId: string, isAdmin: boolean = false): Promise<AgentConfig[]> {
  let data: any = null;
  let error: any = null;

  if (isAdmin) {
    const res = await supabase.from('ai_agents').select('*').order('order_index', { ascending: true });
    data = res.data; error = res.error;
  } else {
    const res = await supabase.from('ai_agents').select('*').or(`user_id.eq.${userId},is_global.eq.true`).order('order_index', { ascending: true });
    if (res.error && res.error.message.includes('is_global')) {
      const fallback = await supabase.from('ai_agents').select('*').eq('user_id', userId).order('order_index', { ascending: true });
      data = fallback.data; error = fallback.error;
    } else {
      data = res.data; error = res.error;
    }
  }

  if (error) return [];
  
  const myItems = data ? data.filter((d: any) => d.user_id === userId) : [];
  if (myItems.length === 0) {
    const defaults = DEFAULT_AGENTS.map(a => ({
      user_id: userId, nome: a.nome, system_prompt: a.systemPrompt, order_index: a.order,
      use_n8n: a.useN8n, n8n_response_url: a.n8nResponseUrl, is_active: true
    }));
    const { data: inserted } = await supabase.from('ai_agents').insert(defaults).select();
    const combinedData = [...(data || []), ...(inserted || [])];
    return combinedData.map((d: any) => ({
      id: d.id, nome: d.nome, systemPrompt: d.system_prompt, order: d.order_index,
      selectedSkills: d.selected_skills || [], enableMonitoring: d.enable_monitoring,
      monitoringInterval: d.monitoring_interval, useN8n: d.use_n8n,
      n8nResponseUrl: d.n8n_response_url, webhookUrl: d.webhook_url, moduleId: d.module_id,
      isGlobal: d.is_global, userId: d.user_id
    }));
  }

  return data.map((d: any) => ({
    id: d.id, nome: d.nome, systemPrompt: d.system_prompt, order: d.order_index,
    selectedSkills: d.selected_skills || [], enableMonitoring: d.enable_monitoring,
    monitoringInterval: d.monitoring_interval, useN8n: d.use_n8n,
    n8nResponseUrl: d.n8n_response_url, webhookUrl: d.webhook_url, moduleId: d.module_id,
    isGlobal: d.is_global, userId: d.user_id
  }));
}

export async function fetchDbPrompts(userId: string, isAdmin: boolean = false): Promise<PromptConfig[]> {
  let data: any = null;
  let error: any = null;

  if (isAdmin) {
    const res = await supabase.from('ai_prompts').select('*');
    data = res.data; error = res.error;
  } else {
    const res = await supabase.from('ai_prompts').select('*').or(`user_id.eq.${userId},is_global.eq.true`);
    if (res.error && res.error.message.includes('is_global')) {
      const fallback = await supabase.from('ai_prompts').select('*').eq('user_id', userId);
      data = fallback.data; error = fallback.error;
    } else {
      data = res.data; error = res.error;
    }
  }

  if (error) return [];

  const myItems = data ? data.filter((d: any) => d.user_id === userId) : [];
  if (myItems.length === 0) {
    const defaults = DEFAULT_PROMPTS.map(p => ({
      user_id: userId, title: p.title, role: p.role, content: p.content, is_active: p.isActive
    }));
    const { data: inserted } = await supabase.from('ai_prompts').insert(defaults).select();
    const combinedData = [...(data || []), ...(inserted || [])];
    return combinedData.map((d: any) => ({
      id: d.id, title: d.title, role: d.role, content: d.content, isActive: d.is_active, moduleId: d.module_id, isGlobal: d.is_global, userId: d.user_id
    }));
  }

  return data.map((d: any) => ({
    id: d.id, title: d.title, role: d.role, content: d.content, isActive: d.is_active, moduleId: d.module_id, isGlobal: d.is_global, userId: d.user_id
  }));
}

// Fallbacks locais
export function loadAgentsFromStorage(): AgentConfig[] { return DEFAULT_AGENTS; }
export function saveAgentsToStorage(agents: AgentConfig[]): void {}
export function loadPromptsFromStorage(): PromptConfig[] { return DEFAULT_PROMPTS; }
export function savePromptsToStorage(prompts: PromptConfig[]): void {}

// Execução Gemini
export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  skillsOverride?: DynamicSkill[]
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');
  
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicSkills = skillsOverride || [];
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const allFunctionTools = [...JOTA_TOOLS_MANIFEST, ...dynamicManifests];
  const toolsArray: any[] = [];
  if (allFunctionTools.length > 0) toolsArray.push({ functionDeclarations: allFunctionTools });

  const initialBody = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    tools: toolsArray.length > 0 ? toolsArray : undefined,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }, 
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initialBody) });
  const data = await response.json();
  if (data.error) throw new Error(`Erro API Gemini: ${data.error.message}`);
  
  let message = data?.candidates?.[0]?.content;
  if (!message) return "Sem resposta da IA.";

  if (message.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        const result = await executeSkill(name, args, dynamicSkills);
        toolResults.push({ functionResponse: { name, response: { result } } });
      }
    }
    
    const finalBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      tools: toolsArray.length > 0 ? toolsArray : undefined,
      contents: [ { role: 'user', parts: [{ text: userContent }] }, message, { role: 'function', parts: toolResults } ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    };
    
    const finalRes = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalBody) });
    const finalData = await finalRes.json();
    return finalData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
  }
  
  return message.parts?.map((p: any) => p.text || '').join('\n') || '';
}

export async function sendChatMessage(
  history: ChatMessage[],
  apiKey: string,
  skillsOverride: DynamicSkill[],
  onToolCall?: (toolName: string) => void
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');
  
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicManifests = skillsOverride.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  const toolsArray = dynamicManifests.length > 0 ? [{ functionDeclarations: dynamicManifests }] : undefined;
  const skillsList = skillsOverride.map(s => `- ${s.name}: ${s.description}`).join('\n');

  const systemPrompt = `Você é o Assistente Inteligente da Jota Contabilidade. 
  FERRAMENTAS DISPONÍVEIS:\n${skillsList || "Nenhuma ferramenta no momento."}\n
  Sempre que o usuário perguntar algo relacionado a estas ferramentas, chame-as obrigatoriamente.
  Responda de forma profissional e use Markdown.`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: history,
    tools: toolsArray,
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  const message = data?.candidates?.[0]?.content;
  if (!message) return "Desculpe, não consegui processar.";

  if (message.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        if (onToolCall) onToolCall(name);
        const result = await executeSkill(name, args, skillsOverride);
        toolResults.push({ functionResponse: { name, response: { result } } });
      }
    }
    const updatedHistory = [...history, message, { role: 'function', parts: toolResults }];
    return sendChatMessage(updatedHistory, apiKey, skillsOverride, onToolCall);
  }
  return message.parts?.map((p: any) => p.text || '').join('\n') || '';
}

export async function callAgentWebhook(agent: AgentConfig, userContent: string, previousReports?: Record<string, string>): Promise<string> {
  if (!agent.webhookUrl) throw new Error(`Webhook não configurado.`);
  const sessionId = localStorage.getItem('jota-session-id') || Math.random().toString(36).substring(7);
  localStorage.setItem('jota-session-id', sessionId);

  const response = await fetch(agent.webhookUrl.trim(), { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ 
      agentName: agent.nome, sessionId, responseUrl: agent.n8nResponseUrl || 'http://localhost:3001/agent-result',
      data: JSON.parse(userContent), previousReports 
    }) 
  });
  const data = await response.json();
  return data.report || data.output || "Processamento iniciado no n8n...";
}