import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from './geminiService';
import { DynamicSkill, executeSkill } from './skills/taxSkills';

export const VERTEX_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

export interface VertexConfig {
  vertex_api_key: string;
  vertex_price_per_1m_input_tokens: number;
  vertex_price_per_1m_output_tokens: number;
  vertex_profit_multiplier: number;
  credit_conversion_rate: number;
}

export async function getVertexConfig(): Promise<VertexConfig> {
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 'global_config')
    .maybeSingle();
  const d = (data as any) || {};
  return {
    vertex_api_key: d.vertex_api_key || '',
    vertex_price_per_1m_input_tokens: Number(d.vertex_price_per_1m_input_tokens) || 1.25,
    vertex_price_per_1m_output_tokens: Number(d.vertex_price_per_1m_output_tokens) || 2.50,
    vertex_profit_multiplier: Number(d.vertex_profit_multiplier) || 4.0,
    credit_conversion_rate: Number(d.credit_conversion_rate) || 10.0,
  };
}

export async function getUserCreditsVertex(userId: string): Promise<number> {
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function debitVertexCredits(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  config: VertexConfig,
  model: string
): Promise<number> {
  const costInput = (inputTokens / 1_000_000) * config.vertex_price_per_1m_input_tokens * config.vertex_profit_multiplier;
  const costOutput = (outputTokens / 1_000_000) * config.vertex_price_per_1m_output_tokens * config.vertex_profit_multiplier;
  const totalCostUsd = costInput + costOutput;

  let creditsToDebit = Math.ceil(totalCostUsd * config.credit_conversion_rate * 100) / 100;
  if (creditsToDebit < 0.01) creditsToDebit = 0.01;

  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!wallet) throw new Error('Carteira não encontrada.');
  if (Number(wallet.balance) < creditsToDebit) throw new Error('Créditos insuficientes.');

  const newBalance = Math.round((Number(wallet.balance) - creditsToDebit) * 100) / 100;

  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  if (walletError) throw new Error('Erro ao descontar créditos: ' + walletError.message);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -creditsToDebit,
    type: 'consumption',
    description: `Chat Vertex (${model}) — ${inputTokens} tokens entrada, ${outputTokens} tokens saída`,
  });

  return creditsToDebit;
}

function sanitizeParameters(parameters: any): any {
  if (!parameters || typeof parameters !== 'object') return { type: 'object', properties: {} };
  const props = parameters.properties || {};
  const sanitizedProps: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      sanitizedProps[key] = value;
    }
  }
  return {
    ...parameters,
    properties: sanitizedProps,
    required: (parameters.required || []).filter((r: string) => sanitizedProps[r] !== undefined),
  };
}

export async function sendVertexMessage(
  history: ChatMessage[],
  model: string,
  apiKey: string,
  skills: DynamicSkill[],
  systemPromptOverride?: string,
  useGrounding?: boolean,
  onToolCall?: (toolName: string) => void
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const dynamicManifests = skills
    .filter(s => /^[a-zA-Z_]/.test(s.name))
    .map(s => ({
      name: s.name,
      description: s.description,
      parameters: sanitizeParameters(s.parameters)
    }));
  const lastUserMessage = history[history.length - 1]?.parts[0]?.text || '';
  const isExplicitSkillCall = lastUserMessage.includes('@');

  let tools: any[] | undefined;
  if (isExplicitSkillCall && dynamicManifests.length > 0) {
    tools = [{ functionDeclarations: dynamicManifests }];
  } else if (useGrounding) {
    tools = [{ google_search: {} }];
  } else if (dynamicManifests.length > 0) {
    tools = [{ functionDeclarations: dynamicManifests }];
  }

  const skillsList = skills.map(s => `- ${s.name}: ${s.description}`).join('\n');
  const basePrompt = systemPromptOverride || 'Você é o Assistente Inteligente da Jota Contabilidade.';
  const finalSystemPrompt = `${basePrompt}\n\nFERRAMENTAS DISPONÍVEIS:\n${skillsList || 'Nenhuma ferramenta disponível.'}\n\nUse ferramentas apenas quando o contexto exigir dados em tempo real ou cálculos específicos.`;

  const body = {
    systemPrompt: finalSystemPrompt,
    history,
    tools,
    model,
    apiKey: apiKey || '',
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  };

  console.log('[vertexService] apiKey presente:', !!apiKey, 'length:', apiKey?.length);

  const { data, error } = await supabase.functions.invoke('chat-gemini', { body });
  if (error) throw new Error('Erro Vertex API: ' + error.message);
  if (data?.error) throw new Error(data.error);

  const message = data?.message;
  if (!message) return { text: 'Sem resposta da IA.', inputTokens: 0, outputTokens: 0 };

  if (message.parts?.some((p: any) => p.functionCall)) {
    const toolResults: any[] = [];
    for (const part of message.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        if (onToolCall) onToolCall(name);
        const result = await executeSkill(name, args, skills);
        toolResults.push({ functionResponse: { name, response: { result } } });
      }
    }
    const updatedHistory = [...history, message, { role: 'function' as const, parts: toolResults }];
    return sendVertexMessage(updatedHistory, model, apiKey, skills, systemPromptOverride, useGrounding, onToolCall);
  }

  const text = message.parts?.map((p: any) => p.text || '').join('\n') || '';
  const inputTokens = data?.usageMetadata?.promptTokenCount || 0;
  const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;

  return { text, inputTokens, outputTokens };
}
