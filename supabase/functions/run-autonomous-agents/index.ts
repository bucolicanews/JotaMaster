import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const fetchWithTimeout = async (url: string, options: any, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
};

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Busca apenas agentes ativos
    const { data: agents, error } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('enable_monitoring', true)

    if (error || !agents) throw error;

    const nowUtc = new Date();
    
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short'
    });

    const parts = formatter.formatToParts(nowUtc);
    const get = (type: string) => parts.find(p => p.type === type)?.value;

    const brDateString = `${get('year')}-${get('month')}-${get('day')}`;
    const brTimeNow = `${get('hour')}:${get('minute')}`;
    const brDayOfMonth = Number(get('day'));
    const weekMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const brDayOfWeek = weekMap[get('weekday') as string] ?? -1;

    let executedCount = 0;

    for (const agent of agents) {
      const lastRunRaw = new Date(agent.last_run);
      const lastRun = isNaN(lastRunRaw.getTime()) ? new Date(0) : lastRunRaw;
      
      const lastRunParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
      }).formatToParts(lastRun);

      const getLast = (type: string) => lastRunParts.find(p => p.type === type)?.value;
      const lastRunBrString = `${getLast('year')}-${getLast('month')}-${getLast('day')}`;

      let shouldRun = false;
      let reason = "";

      // ====== TEMPO ======
      if (agent.schedule_type === 'interval') {
        const intervalMs = (agent.monitoring_interval || 60) * 60 * 1000;
        if (nowUtc.getTime() - lastRun.getTime() >= (intervalMs - 10000)) {
          shouldRun = true; reason = "Intervalo";
        }
      } 
      else if (agent.schedule_type === 'specific_date' && agent.scheduled_at) {
        const scheduledTime = new Date(agent.scheduled_at);
        if (nowUtc.getTime() >= scheduledTime.getTime() && lastRun.getTime() < scheduledTime.getTime()) {
          shouldRun = true; reason = "Data exata";
        }
      }
      else if (agent.scheduled_at) {
        const targetTime = agent.scheduled_at;
        const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        
        const isTimeReached = toMinutes(brTimeNow) >= toMinutes(targetTime);
        const alreadyRunToday = lastRunBrString === brDateString;

        if (isTimeReached && !alreadyRunToday) {
          if (agent.schedule_type === 'daily') { shouldRun = true; reason = "Diário"; } 
          else if (agent.schedule_type === 'weekdays' && brDayOfWeek >= 1 && brDayOfWeek <= 5) { shouldRun = true; reason = "Dias úteis"; } 
          else if (agent.schedule_type === 'monthly' && Number(agent.schedule_day) === brDayOfMonth) { shouldRun = true; reason = "Mensal"; }
        }
      }

      if (shouldRun) {
        // Atualiza a hora para evitar duplo disparo
        await supabaseAdmin.from('ai_agents').update({ last_run: nowUtc.toISOString() }).eq('id', agent.id);

        try {
          let reportContent = "";

          if (agent.use_n8n && agent.webhook_url) {
            // EXECUTA N8N
            await fetchWithTimeout(agent.webhook_url.trim(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentName: agent.nome,
                responseUrl: agent.n8n_response_url,
                trigger: agent.cron_prompt
              })
            }, 5000);
            reportContent = "Webhook n8n acionado com sucesso.";
            
            await supabaseAdmin.from('agent_execution_logs').insert({
              agent_id: agent.id,
              user_id: agent.user_id,
              status: 'success',
              execution_log: reportContent
            });
            executedCount++;
            
          } else {
            // EXECUTA GEMINI REAL
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('api_key')
              .eq('id', agent.user_id)
              .single();

            const userApiKey = profile?.api_key;

            // ===== DEGRADAÇÃO GRACIOSA (FAIL SAFE) =====
            // Se o usuário não configurou a chave no banco de dados, o motor ignora a requisição limpidamente.
            if (!userApiKey) {
               console.warn(`[Motor V6.2] Agente ${agent.nome} ignorado: Usuário sem API Key.`);
               await supabaseAdmin.from('agent_execution_logs').insert({
                 agent_id: agent.id,
                 user_id: agent.user_id,
                 status: 'error',
                 execution_log: "Execução abortada: Chave API do Gemini não configurada na aba Configurações. A IA não pode pensar em background sem esta chave."
               });
               continue; // Pula para o próximo agente do loop
            }

            const payload = {
              system_instruction: { parts: [{ text: agent.system_prompt || "Você é um assistente." }] },
              contents: [{ role: 'user', parts: [{ text: agent.cron_prompt || "Inicie rotina." }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }, 
            };

            const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }, 25000);

            const responseData = await response.json();
            if (!response.ok || responseData.error) throw new Error(responseData.error?.message || "Erro na API Gemini");
            
            reportContent = responseData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || "Sem resposta em texto.";
            
            // GRAVA LOG DE SUCESSO REAL
            await supabaseAdmin.from('agent_execution_logs').insert({
              agent_id: agent.id,
              user_id: agent.user_id,
              status: 'success',
              execution_log: reportContent
            });
            executedCount++;
          }

        } catch (e: any) {
          console.error(`Erro no agente ${agent.nome}:`, e.message);
          await supabaseAdmin.from('agent_execution_logs').insert({
            agent_id: agent.id,
            user_id: agent.user_id,
            status: 'error',
            execution_log: `Falha na comunicação com a API: ${e.message}`
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, executed: executedCount }), { headers: { "Content-Type": "application/json" }, status: 200 });

  } catch (error: any) {
    console.error("[Motor V6.2] Fatal:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
});