import { supabase } from '@/integrations/supabase/client';

export interface AiManifest {
  module_id: string;
  version?: string;
  skills?: any[];
  agents?: any[];
  prompts?: any[];
}

/**
 * Função responsável por ler o ai-manifest.json da CDN do Módulo Filho
 * e injetar as habilidades e agentes no banco de dados do Jota Master (Placa-mãe).
 */
export async function syncModuleManifest(moduleId: string, bundleUrl: string, userId: string): Promise<number> {
  if (!bundleUrl) {
    throw new Error("Módulo não possui URL externa (bundle_url) configurada no catálogo.");
  }

  // Limpa a URL e aponta para o manifesto
  const baseUrl = bundleUrl.endsWith('/') ? bundleUrl.slice(0, -1) : bundleUrl;
  const manifestUrl = `${baseUrl}/ai-manifest.json`;

  try {
    // 1. Faz o download do Cérebro do Módulo
    const response = await fetch(manifestUrl, { cache: 'no-store' });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("O módulo não possui um ai-manifest.json na raiz do projeto.");
      }
      throw new Error(`Falha de rede ao buscar o manifesto: ${response.status}`);
    }

    const manifest: AiManifest = await response.json();
    let totalAbsorbed = 0;

    // 2. Limpa a Inteligência Antiga deste Módulo para evitar duplicidade
    // (Caso seja uma atualização do módulo)
    await supabase.from('ai_skills').delete().eq('user_id', userId).eq('module_id', moduleId);
    await supabase.from('ai_agents').delete().eq('user_id', userId).eq('module_id', moduleId);
    await supabase.from('ai_prompts').delete().eq('user_id', userId).eq('module_id', moduleId);

    // 3. Absorve as Novas Skills (Ferramentas)
    if (manifest.skills && manifest.skills.length > 0) {
      const skillsToInsert = manifest.skills.map((s: any) => ({
        user_id: userId,
        module_id: moduleId,
        name: s.name,
        description: s.description,
        execution_type: s.executionType || 'local_js',
        js_code: s.jsCode || null,
        webhook_url: s.webhookUrl || null,
        parameters: s.parameters || {},
        suggested_instruction: s.suggestedInstruction || '',
        is_active: true
      }));

      const { error } = await supabase.from('ai_skills').insert(skillsToInsert);
      if (error) throw new Error("Erro ao salvar Skills no banco: " + error.message);
      totalAbsorbed += skillsToInsert.length;
    }

    // 4. Absorve os Novos Agentes
    if (manifest.agents && manifest.agents.length > 0) {
      const agentsToInsert = manifest.agents.map((a: any) => ({
        user_id: userId,
        module_id: moduleId,
        nome: a.nome,
        system_prompt: a.systemPrompt,
        is_active: true
      }));

      const { error } = await supabase.from('ai_agents').insert(agentsToInsert);
      if (error) throw new Error("Erro ao salvar Agentes no banco: " + error.message);
      totalAbsorbed += agentsToInsert.length;
    }

    return totalAbsorbed;

  } catch (error: any) {
    console.error("[AI Ecosystem] Falha ao sincronizar manifesto:", error);
    throw error;
  }
}