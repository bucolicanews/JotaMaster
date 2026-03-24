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

  // Garante que a URL termine com / para concatenar o manifesto
  const baseUrl = bundleUrl.replace(/\/$/, "");
  const manifestUrl = `${baseUrl}/ai-manifest.json`;

  try {
    console.log(`[AI Ecosystem] Tentando sincronizar: ${manifestUrl}`);
    
    // 1. Faz o download do Cérebro do Módulo
    // Usamos mode: 'cors' explicitamente para disparar o erro correto se falhar
    const response = await fetch(manifestUrl, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-store' 
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("O arquivo 'ai-manifest.json' não foi encontrado na raiz do módulo.");
      }
      throw new Error(`O servidor do módulo respondeu com erro ${response.status}.`);
    }

    const manifest: AiManifest = await response.json();
    let totalAbsorbed = 0;

    // 2. Limpa a Inteligência Antiga deste Módulo para evitar duplicidade
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

    // 5. Absorve os Novos Prompts
    if (manifest.prompts && manifest.prompts.length > 0) {
      const promptsToInsert = manifest.prompts.map((p: any) => ({
        user_id: userId,
        module_id: moduleId,
        title: p.title,
        role: p.role || 'Especialista',
        content: p.content,
        is_active: true
      }));

      const { error } = await supabase.from('ai_prompts').insert(promptsToInsert);
      if (error) throw new Error("Erro ao salvar Prompts no banco: " + error.message);
      totalAbsorbed += promptsToInsert.length;
    }

    return totalAbsorbed;

  } catch (error: any) {
    console.error("[AI Ecosystem] Falha crítica na sincronização:", error);
    
    // Tratamento amigável para erro de CORS ou Rede
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Falha de Conexão ou CORS: O servidor do módulo bloqueou o acesso ou está offline. Verifique se o HTTPS está ativo e se o CORS permite o domínio jotaempresas.com.");
    }
    
    throw error;
  }
}