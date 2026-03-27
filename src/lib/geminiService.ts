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
  cronPrompt?: string;
  lastRun?: string;
  // NOVO: Tipos de Agendamento Expandidos
  scheduleType?: 'interval' | 'daily' | 'weekdays' | 'monthly' | 'specific_date';
  scheduledAt?: string; // Usado para Data Específica (ISO completo) ou apenas Hora (HH:mm) para diário/semanal
  scheduleDay?: number; // Usado para Dia do Mês (1-31)
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
    isGlobal: d.is_global, userId: d.user_id,
    cronPrompt: d.cron_prompt, lastRun: d.last_run,
    scheduleType: d.schedule_type || 'interval',
    scheduledAt: d.scheduled_at,
    scheduleDay: d.schedule_day
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
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  const useGrounding = localStorage.getItem('jota-gemini-search') === 'true';
  
  const dynamicSkills = skillsOverride || [];
  const dynamicManifests = dynamicSkills.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  
  let tools: any[] | undefined = undefined;
  const isExplicitSearch = userContent.toLowerCase().includes("pesquise") ||
                           userContent.toLowerCase().includes("google") ||
                           userContent.toLowerCase().includes("internet");

  if (dynamicManifests.length > 0 && !isExplicitSearch) {
    tools = [{ functionDeclarations: dynamicManifests }];
  } else if (useGrounding) {
    tools = [{ google_search: {} }];
  } else if (dynamicManifests.length > 0) {
    tools = [{ functionDeclarations: dynamicManifests }];
  }

  const enhancedSystemPrompt = `${systemPrompt}\n\nREGRA CRÍTICA: Se houver uma ferramenta disponível para obter dados reais (como CEP ou cálculos), você DEVE usá-la. Não responda com base em seu conhecimento interno se a ferramenta puder fornecer o dado exato.`;

  const initialBody = {
    systemPrompt: enhancedSystemPrompt,
    history: [{ role: 'user', parts: [{ text: userContent }] }],
    tools: tools,
    model: model,
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };

  const { data, error } = await supabase.functions.invoke('chat-gemini', {
    body: initialBody
  });

  if (error) throw new Error(`Erro API Gemini (Edge): ${error.message}`);
  if (data?.error) throw new Error(data.error);
  
  let message = data?.message;
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
      systemPrompt: enhancedSystemPrompt,
      tools: tools,
      model: model,
      history: [ { role: 'user', parts: [{ text: userContent }] }, message, { role: 'function', parts: toolResults } ],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    };
    
    const { data: finalData, error: finalError } = await supabase.functions.invoke('chat-gemini', {
      body: finalBody
    });

    if (finalError) throw new Error(`Erro API Gemini (Edge): ${finalError.message}`);
    if (finalData?.error) throw new Error(finalData.error);

    return finalData?.message?.parts?.map((p: any) => p.text || '').join('\n') || '';
  }
  
  return message.parts?.map((p: any) => p.text || '').join('\n') || '';
}

export async function sendChatMessage(
  history: ChatMessage[],
  apiKey: string,
  skillsOverride: DynamicSkill[],
  onToolCall?: (toolName: string) => void,
  useGroundingOverride?: boolean,
  systemPromptOverride?: string
): Promise<string> {
  const model = localStorage.getItem('jota-gemini-model') || 'gemini-2.0-flash';
  
  const lastUserMessage = history[history.length - 1]?.parts[0]?.text || "";
  const isExplicitSkillCall = lastUserMessage.includes('@');
  
  const useGrounding = useGroundingOverride !== undefined
    ? useGroundingOverride
    : localStorage.getItem('jota-gemini-search') === 'true';

  const dynamicManifests = skillsOverride.map(s => ({ name: s.name, description: s.description, parameters: s.parameters }));
  
  let tools: any[] | undefined = undefined;

  if (isExplicitSkillCall) {
    if (dynamicManifests.length > 0) {
      tools = [{ functionDeclarations: dynamicManifests }];
    }
  } else if (useGrounding) {
    tools = [{ google_search: {} }];
  } else if (dynamicManifests.length > 0) {
    tools = [{ functionDeclarations: dynamicManifests }];
  }

  const skillsList = skillsOverride.map(s => `- ${s.name}: ${s.description}`).join('\n');
  
  const baseSystemPrompt = systemPromptOverride || `Você é o Assistente Inteligente da Jota Contabilidade.`;

  const finalSystemPrompt = `${baseSystemPrompt}
  
  FERRAMENTAS DISPONÍVEIS:
  ${skillsList || "Nenhuma ferramenta no momento (Modo Grátis)."}
  
  DIRETRIZES OBRIGATÓRIAS:
  1. Se o usuário fornecer um dado (como CEP, CNPJ ou valores para cálculo) que possa ser processado por uma ferramenta acima, você DEVE chamar a ferramenta.
  2. NÃO responda com base em seu conhecimento interno se houver uma ferramenta que possa obter dados em tempo real ou realizar cálculos precisos.
  3. Se o Grounding estiver ativo, use a pesquisa do Google para dados externos (cotações, notícias, leis).
  
  Responda de forma profissional e use Markdown.`;

  const body = {
    systemPrompt: finalSystemPrompt,
    history: history,
    tools: tools,
    model: model,
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  const { data, error } = await supabase.functions.invoke('chat-gemini', {
    body: body
  });

  if (error) throw new Error(`Erro API Gemini (Edge): ${error.message}`);
  if (data?.error) throw new Error(data.error);
  
  const message = data?.message;
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
    return sendChatMessage(updatedHistory, apiKey, skillsOverride, onToolCall, useGrounding, systemPromptOverride);
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