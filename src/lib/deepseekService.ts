import { supabase } from '@/integrations/supabase/client';
import { DynamicSkill, executeSkill } from './skills/taxSkills';

export const DEEPSEEK_MODELS = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
];


export interface DeepSeekConfig {
  deepseek_api_key: string;
  deepseek_price_per_1m_input_tokens: number;
  deepseek_price_per_1m_output_tokens: number;
  deepseek_profit_multiplier: number;
  credit_conversion_rate: number;
}

export async function getDeepSeekConfig(): Promise<DeepSeekConfig> {
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 'global_config')
    .maybeSingle();
  const d = (data as any) || {};
  return {
    deepseek_api_key: d.deepseek_api_key || '',
    deepseek_price_per_1m_input_tokens: Number(d.deepseek_price_per_1m_input_tokens) || 0.27,
    deepseek_price_per_1m_output_tokens: Number(d.deepseek_price_per_1m_output_tokens) || 1.10,
    deepseek_profit_multiplier: Number(d.deepseek_profit_multiplier) || 3.0,
    credit_conversion_rate: Number(d.credit_conversion_rate) || 10.0,
  };
}

export async function getUserCreditsDeepSeek(userId: string): Promise<number> {
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function debitDeepSeekCredits(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  config: DeepSeekConfig,
  model: string
): Promise<number> {
  const costInput = (inputTokens / 1_000_000) * config.deepseek_price_per_1m_input_tokens * config.deepseek_profit_multiplier;
  const costOutput = (outputTokens / 1_000_000) * config.deepseek_price_per_1m_output_tokens * config.deepseek_profit_multiplier;
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
    description: `Chat DeepSeek (${model}) — ${inputTokens} tokens entrada, ${outputTokens} tokens saída`,
  });

  return creditsToDebit;
}

export interface DeepSeekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepSeekResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

function buildToolsSystemPrompt(skills: DynamicSkill[], basePrompt?: string): string {
  const toolDescriptions = skills.map(s => {
    const params = s.parameters?.properties
      ? Object.entries(s.parameters.properties)
          .map(([k, v]: [string, any]) => `  - ${k} (${v.type}): ${v.description || ''}`)
          .join('\n')
      : '';
    const required = s.parameters?.required?.join(', ') || '';
    return `### ${s.name}\nDescrição: ${s.description}\nParâmetros obrigatórios: ${required}\n${params}`;
  }).join('\n\n');

  const toolNames = skills.map(s => s.name).join(', ');

  return `${basePrompt || 'Você é um assistente inteligente e prestativo. Responda sempre em português, de forma clara e completa.'}

FERRAMENTAS DISPONÍVEIS (use apenas quando o contexto exigir dados em tempo real ou cálculos específicos):
${toolDescriptions}

REGRAS DE USO DAS FERRAMENTAS:
- Use uma ferramenta SOMENTE quando o usuário fornecer dados específicos que ela processa (ex: um CEP, um valor de salário para cálculo de IR).
- Para perguntas gerais, conversas, explicações e conhecimento geral, responda normalmente com seu próprio conhecimento.
- Nunca mencione as ferramentas ao usuário nem diga que suas respostas são limitadas a elas.
- Quando for chamar uma ferramenta, responda APENAS com este JSON (sem texto antes ou depois):
{"tool_call":{"name":"NOME_DA_FERRAMENTA","args":{"param1":"valor1"}}}

Ferramentas disponíveis: ${toolNames}

Após receber o resultado da ferramenta, responda normalmente em Markdown com os dados retornados.`;
}

function extractToolCall(text: string): { name: string; args: Record<string, any> } | null {
  try {
    const match = text.match(/\{[\s\S]*"tool_call"[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (parsed?.tool_call?.name && parsed?.tool_call?.args !== undefined) {
      return parsed.tool_call;
    }
  } catch {
  }
  return null;
}

async function callDeepSeekAPI(
  messages: DeepSeekMessage[],
  model: string,
): Promise<DeepSeekResult> {
  const { data, error } = await supabase.functions.invoke('chat-deepseek', {
    body: { messages, model },
  });

  if (error) throw new Error('Erro DeepSeek: ' + error.message);

  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  if (parsed?.error) throw new Error(parsed.error);

  return {
    text: parsed?.text || '',
    inputTokens: parsed?.usage?.prompt_tokens || 0,
    outputTokens: parsed?.usage?.completion_tokens || 0,
  };
}

export async function sendDeepSeekMessage(
  history: DeepSeekMessage[],
  model: string,
  _apiKey: string,
  skills: DynamicSkill[],
  systemPrompt?: string,
  onToolCall?: (toolName: string) => void
): Promise<DeepSeekResult> {
  const messages: DeepSeekMessage[] = [];

  if (skills.length > 0) {
    messages.push({ role: 'system', content: buildToolsSystemPrompt(skills, systemPrompt) });
  } else if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push(...history);

  const result = await callDeepSeekAPI(messages, model);

  const toolCall = extractToolCall(result.text);
  if (toolCall) {
    if (onToolCall) onToolCall(toolCall.name);

    const skillResult = await executeSkill(toolCall.name, toolCall.args, skills);

    const messagesWithResult: DeepSeekMessage[] = [
      ...messages,
      { role: 'assistant', content: result.text },
      {
        role: 'user',
        content: `Resultado da ferramenta "${toolCall.name}":\n\`\`\`json\n${JSON.stringify(skillResult, null, 2)}\n\`\`\`\n\nAgora responda ao usuário com base nesse resultado.`,
      },
    ];

    const finalResult = await callDeepSeekAPI(messagesWithResult, model);
    return {
      text: finalResult.text,
      inputTokens: result.inputTokens + finalResult.inputTokens,
      outputTokens: result.outputTokens + finalResult.outputTokens,
    };
  }

  return result;
}
