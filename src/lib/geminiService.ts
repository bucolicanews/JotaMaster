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

export const DEFAULT_PRE_ANALYSIS_PROMPT = `Você é o Perito Tributário Sênior da Jota Contabilidade. Sua missão é entregar um MANUAL DE ESTRUTURAÇÃO FISCAL E VIABILIDADE (Nível 10/10).`;

// Busca do Banco de Dados
export async function fetchDbAgents(userId: string, isAdmin: boolean = false): Promise<AgentConfig[]> {
  const res = await supabase.from('ai_agents').select('*').or(`user_id.eq.${userId},is_global.eq.true`).order('order_index', { ascending: true });
  if (res.error) return [];
  return res.data.map((d: any) => ({
    id: d.id, nome: d.nome, systemPrompt: d.system_prompt, order: d.order_index,
    selectedSkills: d.selected_skills || [], enableMonitoring: d.enable_monitoring,
    monitoringInterval: d.monitoring_interval, useN8n: d.use_n8n,
    n8nResponseUrl: d.n8n_response_url, webhookUrl: d.webhook_url, moduleId: d.module_id,
    isGlobal: d.is_global, userId: d.user_id
  }));
}

export async function fetchDbPrompts(userId: string, isAdmin: boolean = false): Promise<PromptConfig[]> {
  const res = await supabase.from('ai_prompts').select('*').or(`user_id.eq.${userId},is_global.eq.true`);
  if (res.error) return [];
  return res.data.map((d: any) => ({
    id: d.id, title: d.title, role: d.role, content: d.content, isActive: d.is_active, moduleId: d.module_id, isGlobal: d.is_global, userId: d.user_id
  }));
}

// Execução Gemini
export async function callGeminiAgent(
  systemPrompt: string,
  userContent: string,
  apiKey: string,
  skillsOverride?: DynamicSkill[]
): Promise<string> {
  if (!apiKey) throw new Error('Chave API Gemini não configurada.');
  
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const useGrounding = localStorage.getItem('jota-gemini-search') === 'true';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const dynamicSkills = skillsOverride || [];
  const toolsArray: any[] = [];

  // Adiciona Skills customizadas se houver
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  if (dynamicManifests.length > 0) {
    toolsArray.push({ functionDeclarations: dynamicManifests });
  }

  // Adiciona Grounding (Google Search) se ativado nas configurações
  // Corrigido para o novo formato exigido pela API: google_search
  if (useGrounding) {
    toolsArray.push({ google_search: {} });
  }

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

  // Se a IA chamou uma função (Skill), executa e retorna
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
  const useGrounding = localStorage.getItem('jota-gemini-search') === 'true';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const toolsArray: any[] = [];
  const dynamicManifests = skillsOverride.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  
  if (dynamicManifests.length > 0) {
    toolsArray.push({ functionDeclarations: dynamicManifests });
  }

  // Corrigido para o novo formato exigido pela API: google_search
  if (useGrounding) {
    toolsArray.push({ google_search: {} });
  }

  const skillsList = skillsOverride.map(s => `- ${s.name}: ${s.description}`).join('\n');
  const systemPrompt = `Você é o Assistente Inteligente da Jota Contabilidade. 
  FERRAMENTAS DISPONÍVEIS:\n${skillsList || "Nenhuma ferramenta no momento (Modo Grátis)."}\n
  Responda de forma profissional e use Markdown.`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: history,
    tools: toolsArray.length > 0 ? toolsArray : undefined,
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