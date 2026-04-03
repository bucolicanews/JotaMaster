import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { messages, model } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: sysSettings } = await supabaseAdmin
      .from('system_settings')
      .select('groq_api_key')
      .eq('id', 'global_config')
      .maybeSingle()

    const apiKey = (sysSettings as any)?.groq_api_key || '';

    console.log('[chat-groq] apiKey length:', apiKey?.length ?? 0);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Configure a Groq API Key no Painel Admin.' }), { status: 400, headers: corsHeaders })
    }

    const targetModel = model || 'llama-3.3-70b-versatile';

    console.log(`[chat-groq] Usuário ${user.id} | Modelo: ${targetModel} | messages: ${messages?.length}`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: targetModel, messages, stream: false })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[chat-groq] Erro na API Groq:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: `Erro na API Groq: ${data.error?.message || 'Desconhecido'}` }), { status: 500, headers: corsHeaders });
    }

    const text = data.choices?.[0]?.message?.content || '';
    console.log('[chat-groq] text length:', text?.length ?? 0);

    return new Response(JSON.stringify({
      success: true,
      text,
      usage: data.usage
    }), { headers: corsHeaders, status: 200 })

  } catch (error: any) {
    console.error("[chat-groq] Erro não tratado:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
