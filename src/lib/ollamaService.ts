import { supabase } from '@/integrations/supabase/client';
import { DynamicSkill, executeSkill } from './skills/taxSkills';

export const OLLAMA_MODELS = [
  { value: 'llama', label: 'Llama 3' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'deepseek', label: 'DeepSeek Coder 6.7b' },
  { value: 'deepseek-lite', label: 'DeepSeek Coder (latest)' },
  { value: 'qwen7b', label: 'Qwen 2.5 Coder 7b' },
  { value: 'qwen14b', label: 'Qwen 2.5 Coder 14b' },
];

const OLLAMA_BASE_URL = 'http://187.127.3.122:4000';

export interface OllamaConfig {
  illama_api_key: string;
  ollama_price_per_1m_input_tokens: number;
  ollama_price_per_1m_output_tokens: number;
  ollama_profit_multiplier: number;
  credit_conversion_rate: number;
}

export async function getOllamaConfig(): Promise<OllamaConfig> {
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 'global_config')
    .maybeSingle();
  const d = (data as any) || {};
  return {
    illama_api_key: d.illama_api_key || '',
    ollama_price_per_1m_input_tokens: Number(d.ollama_price_per_1m_input_tokens) || 0.50,
    ollama_price_per_1m_output_tokens: Number(d.ollama_price_per_1m_output_tokens) || 1.00,
    ollama_profit_multiplier: Number(d.ollama_profit_multiplier) || 2.0,
    credit_conversion_rate: Number(d.credit_conversion_rate) || 10.0,
  };
}

export async function getOllamaApiKey(): Promise<string | null> {
  const cfg = await getOllamaConfig();
  return cfg?.illama_api_key || null;
}

export async function getUserCredits(userId: string): Promise<number> {
  const { data } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.balance ?? 0;
}

export async function debitOllamaCredits(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  config: OllamaConfig,
  model: string
): Promise<number> {
  const costInput = (inputTokens / 1_000_000) * config.ollama_price_per_1m_input_tokens * config.ollama_profit_multiplier;
  const costOutput = (outputTokens / 1_000_000) * config.ollama_price_per_1m_output_tokens * config.ollama_profit_multiplier;
  const totalCostUsd = costInput + costOutput;

  console.log('[Ollama debit]', { inputTokens, outputTokens, costInput, costOutput, totalCostUsd, config });

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

  if (walletError) {
    console.error('[wallet update error]', walletError);
    throw new Error('Erro ao descontar créditos: ' + walletError.message);
  }

  const { error: txError } = await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -creditsToDebit,
    type: 'consumption',
    description: `Chat Ollama (${model}) — ${inputTokens} tokens entrada, ${outputTokens} tokens saída`,
  });

  if (txError) {
    console.error('[credit_transactions insert error]', txError);
  }

  return creditsToDebit;
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResult {
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

async function callOllamaAPI(
  messages: OllamaMessage[],
  model: string,
  apiKey: string,
  retries = 2
): Promise<OllamaResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model, messages, stream: false }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${err}`);
      }

      const data = await response.json();
      return {
        text: data.choices?.[0]?.message?.content || '',
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
      };
    } catch (err: any) {
      const isNetworkError = err?.message?.includes('ERR_NETWORK') ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('ERR_CONNECTION');

      if (isNetworkError && attempt < retries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw new Error('Falha após múltiplas tentativas.');
}

export async function sendOllamaMessage(
  history: OllamaMessage[],
  model: string,
  apiKey: string,
  skills: DynamicSkill[],
  systemPrompt?: string,
  onToolCall?: (toolName: string) => void
): Promise<OllamaResult> {
  const messages: OllamaMessage[] = [];

  if (skills.length > 0) {
    messages.push({ role: 'system', content: buildToolsSystemPrompt(skills, systemPrompt) });
  } else if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push(...history);

  const result = await callOllamaAPI(messages, model, apiKey);

  const toolCall = extractToolCall(result.text);
  if (toolCall) {
    if (onToolCall) onToolCall(toolCall.name);

    const skillResult = await executeSkill(toolCall.name, toolCall.args, skills);

    const messagesWithResult: OllamaMessage[] = [
      ...messages,
      { role: 'assistant', content: result.text },
      {
        role: 'user',
        content: `Resultado da ferramenta "${toolCall.name}":\n\`\`\`json\n${JSON.stringify(skillResult, null, 2)}\n\`\`\`\n\nAgora responda ao usuário com base nesse resultado.`,
      },
    ];

    const finalResult = await callOllamaAPI(messagesWithResult, model, apiKey);
    return {
      text: finalResult.text,
      inputTokens: result.inputTokens + finalResult.inputTokens,
      outputTokens: result.outputTokens + finalResult.outputTokens,
    };
  }

  return result;
}
