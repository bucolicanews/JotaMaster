import { supabase } from '@/integrations/supabase/client';
import { calculateSimplesNacionalEffectiveRate } from "../simplesNacional";
import { findCClassByNcm, checkIfNcmHasSelectiveTax } from "../tax/taxClassificationService";

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  suggestedInstruction?: string; 
  parameters: any; 
  executionType: 'local_js' | 'webhook' | 'knowledge_base' | 'web_scraping';
  jsCode?: string;
  webhookUrl?: string;
  knowledgeBaseText?: string;
  url?: string;
  selector?: string;
  isActive: boolean;
  moduleId?: string;
  isGlobal?: boolean;
  userId?: string;
}

export const JOTA_TOOLS_MANIFEST: any[] = [];

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export const DEFAULT_DYNAMIC_SKILLS: DynamicSkill[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'consultar_endereco_viacep',
    description: 'Consulta endereço completo via CEP.',
    suggestedInstruction: 'Você tem acesso à ferramenta #consultar_endereco_viacep. Utilize-a para validar o endereço da empresa ou localizar o município correto sempre que um CEP for fornecido.',
    parameters: {
      type: 'object',
      properties: { cep: { type: 'string' } },
      required: ['cep']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: "const cleanCep = String(args.cep).replace(/\\D/g, ''); if (cleanCep.length !== 8) return { error: 'CEP inválido' }; try { const response = await fetch('https://viacep.com.br/ws/' + cleanCep + '/json/'); const data = await response.json(); return data.erro ? { error: 'CEP não localizado' } : data; } catch (e) { return { error: 'Falha no serviço de CEP' }; }"
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'comparar_regimes_tributarios',
    description: 'Realiza o comparativo matemático real entre Simples Nacional e Lucro Presumido.',
    suggestedInstruction: 'Você tem acesso à ferramenta #comparar_regimes_tributarios. Utilize-a obrigatoriamente para realizar simulações matemáticas precisas entre Simples Nacional e Lucro Presumido.',
    parameters: {
      type: 'object',
      properties: {
        faturamento_mensal: { type: 'number', description: 'Receita mensal da empresa' },
        faturamento_12m: { type: 'number', description: 'Faturamento acumulado dos últimos 12 meses' },
        folha_12m: { type: 'number', description: 'Folha de pagamento acumulada dos últimos 12 meses' },
        tipo_atividade: { type: 'string', enum: ['comercio', 'servico', 'industria'] },
        icms_percentual: { type: 'number', description: 'Alíquota de ICMS (ex: 0.17)', default: 0.17 },
        icms_isento: { type: 'boolean', description: 'Indica se há isenção de ICMS', default: false },
        icms_st: { type: 'boolean', description: 'Se o produto está sujeito à ST', default: false },
        iss_percentual: { type: 'number', description: 'Alíquota de ISS (ex: 0.05)', default: 0.05 },
        margem_lucro: { type: 'number', description: 'Margem de lucro alvo', default: 0.15 }
      },
      required: ['faturamento_mensal', 'faturamento_12m', 'folha_12m', 'tipo_atividade']
    },
    executionType: 'local_js',
    isActive: true,
    jsCode: `
const faturamento = args.faturamento_mensal || 0;
const faturamento12m = args.faturamento_12m || (faturamento * 12);
const folha12m = args.folha_12m || 0;
const tipo = args.tipo_atividade || "comercio";

if (faturamento <= 0) return { error: "Faturamento inválido" };

let anexo = "Anexo I";
if (tipo === 'servico') {
  const r = folha12m / faturamento12m;
  anexo = r >= 0.28 ? "Anexo III" : "Anexo V";
} else if (tipo === 'industria') {
  anexo = "Anexo II";
}

const efetivaSimples = helpers.calculateSimplesNacionalEffectiveRate(anexo, faturamento12m);
let impostoSimples = faturamento * (efetivaSimples / 100);

if (args.icms_st || args.icms_isento) {
  impostoSimples = impostoSimples * 0.66; 
}

const presuncaoIRPJ = (tipo === 'comercio' || tipo === 'industria') ? 0.08 : 0.32;
const baseIRPJ = faturamento * presuncaoIRPJ;
const presuncaoCSLL = (tipo === 'comercio' || tipo === 'industria') ? 0.12 : 0.32;
const baseCSLL = faturamento * presuncaoCSLL;

const irpj = baseIRPJ * 0.15;
const adicional = baseIRPJ > 20000 ? (baseIRPJ - 20000) * 0.10 : 0;
const csll = baseCSLL * 0.09;
const pis = faturamento * 0.0065;
const cofins = faturamento * 0.03;
const icms = (tipo !== 'servico' && !args.icms_isento && !args.icms_st) ? faturamento * (args.icms_percentual || 0.17) : 0;
const iss = tipo === 'servico' ? faturamento * (args.iss_percentual || 0.05) : 0;

const totalPresumido = irpj + adicional + csll + pis + cofins + icms + iss;

return {
  fator_r: tipo === 'servico' ? { percentual: ((folha12m/faturamento12m)*100).toFixed(2) + "%", anexo } : "N/A",
  simples: {
    anexo,
    aliquota_efetiva: efetivaSimples.toFixed(2) + "%",
    valor_mensal: impostoSimples,
    observacao: (args.icms_st || args.icms_isento) ? "Cálculo com segregação de ICMS" : "Tributação integral no DAS"
  },
  presumido: {
    presuncao: { irpj: (presuncaoIRPJ*100)+"%", csll: (presuncaoCSLL*100)+"%" },
    detalhamento: { irpj: irpj + adicional, csll, pis_cofins: pis + cofins, icms, iss },
    total: totalPresumido,
    aliquota_efetiva: ((totalPresumido / faturamento) * 100).toFixed(2) + "%"
  },
  veredito: {
    melhor_regime: impostoSimples < totalPresumido ? "Simples Nacional" : "Lucro Presumido",
    economia_mensal: Math.abs(impostoSimples - totalPresumido)
  }
};
    `
  }
];

export async function fetchDbSkills(userId: string, isAdmin: boolean = false): Promise<DynamicSkill[]> {
  let data: any = null;
  let error: any = null;

  if (isAdmin) {
    const res = await supabase.from('ai_skills').select('*');
    data = res.data; error = res.error;
  } else {
    const res = await supabase.from('ai_skills').select('*').or(`user_id.eq.${userId},is_global.eq.true`);
    if (res.error && res.error.message.includes('is_global')) {
      const fallback = await supabase.from('ai_skills').select('*').eq('user_id', userId);
      data = fallback.data; error = fallback.error;
    } else {
      data = res.data; error = res.error;
    }
  }

  if (error) {
    console.error("Erro ao buscar skills do DB:", error);
    return [];
  }

  return data.map((d: any) => ({
    id: d.id, name: d.name, description: d.description,
    suggestedInstruction: d.suggested_instruction, parameters: d.parameters,
    executionType: d.execution_type as any, jsCode: d.js_code, webhookUrl: d.webhook_url,
    knowledgeBaseText: d.knowledge_base_text, url: d.url, selector: d.selector,
    isActive: d.is_active, moduleId: d.module_id, isGlobal: d.is_global, userId: d.user_id
  }));
}

export const loadDynamicSkills = (): DynamicSkill[] => {
  const saved = localStorage.getItem('jota-dynamic-skills');
  return saved ? JSON.parse(saved) : DEFAULT_DYNAMIC_SKILLS;
};

export const saveDynamicSkills = (skills: DynamicSkill[]) => {
  localStorage.setItem('jota-dynamic-skills', JSON.stringify(skills));
};

export async function executeSkill(name: string, args: any, skillsOverride?: DynamicSkill[]): Promise<any> {
  const dynamicSkills = skillsOverride || loadDynamicSkills();
  const skill = dynamicSkills.find(s => s.name === name);

  if (!skill) return { error: "Skill '" + name + "' não encontrada." };
  if (!skill.isActive) return { error: "Skill '" + name + "' está inativa." };
  
  if (skill.executionType === 'knowledge_base') {
    return { status: "sucesso", conteudo_recuperado: skill.knowledgeBaseText || "" };
  }

  if (skill.executionType === 'web_scraping' && skill.url) {
    let targetUrl = skill.url;
    
    // Substitui variáveis na URL (ex: {{cep}})
    if (args && typeof args === 'object') {
      for (const key in args) {
        targetUrl = targetUrl.split('{{' + key + '}}').join(String(args[key]));
      }
    }
    
    // AUTO-CORREÇÃO DE URL (Prevenção de falhas no proxy)
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    // MUDANÇA ARQUITETURAL: Uso da rota /raw do proxy para evitar problemas de JSON e bloqueios CORS
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl);
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Status HTTP Proxy: ' + response.status);
      
      // Lê o HTML direto em formato texto
      const html = await response.text();
      
      // Parseia o HTML bruto
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      let targetElement: Element | null = doc.body;
      
      if (skill.selector) {
        targetElement = doc.querySelector(skill.selector);
        if (!targetElement) return { error: `Seletor CSS '${skill.selector}' não encontrado na página alvo.` };
      }
      
      // Limpeza de ruído que quebra os tokens da IA (Sanitização)
      const noise = targetElement.querySelectorAll('script, style, nav, footer, header, iframe, svg, img');
      noise.forEach(n => n.remove());
      
      const cleanText = ((targetElement as HTMLElement).innerText || "")
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .join('\n');
        
      // Retorna até 12.000 caracteres como proteção contra overflow de contexto do Gemini
      return { status: "sucesso", conteudo: cleanText.substring(0, 12000) };
    } catch (e: any) {
      return { error: "Falha na navegação web (Proxy CORS): " + e.message };
    }
  }

  if (skill.executionType === 'webhook' && skill.webhookUrl) {
    try {
      const res = await fetch(skill.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      return await res.json();
    } catch (e: any) {
      return { error: "Falha no Webhook: " + e.message };
    }
  }

  if (skill.executionType === 'local_js' && skill.jsCode) {
    try {
      const helpers = { calculateSimplesNacionalEffectiveRate, findCClassByNcm, checkIfNcmHasSelectiveTax };
      let codeToExecute = skill.jsCode.trim();
      if (codeToExecute.startsWith('async function') || codeToExecute.startsWith('function')) {
          const firstBrace = codeToExecute.indexOf('{');
          const lastBrace = codeToExecute.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) codeToExecute = codeToExecute.substring(firstBrace + 1, lastBrace);
      }
      // Injetando dependências no escopo restrito da função
      const fn = new AsyncFunction('args', 'helpers', 'supabase', codeToExecute);
      return await fn(args, helpers, supabase);
    } catch (e: any) {
      return { error: "Erro no JS da Skill: " + e.message };
    }
  }

  return { error: "Configuração de execução inválida." };
}