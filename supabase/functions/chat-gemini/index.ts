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
      console.error("[chat-gemini] Falta Authorization header");
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Initialize client to get user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error("[chat-gemini] Erro de autenticação:", authError);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = await req.json()
    const { history, systemPrompt, tools, generationConfig, model } = body;

    // Use service role to bypass RLS and get the user's API key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', user.id)
      .single()

    const apiKey = profile?.api_key || Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      console.error("[chat-gemini] Erro: Nenhuma chave Gemini encontrada no perfil");
      return new Response(JSON.stringify({ error: 'Configure sua Gemini API Key no seu Perfil.' }), { status: 400, headers: corsHeaders })
    }

    const targetModel = model || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const googleBody = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: history,
      tools: tools,
      generationConfig: generationConfig || { temperature: 0.2, maxOutputTokens: 8192 },
    };

    console.log(`[chat-gemini] Chamando Google API para o usuário ${user.id} com modelo ${targetModel}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googleBody)
    });

    const data = await response.json();

    if (!response.ok) {
       console.error("[chat-gemini] Erro na API do Google:", data);
       return new Response(JSON.stringify({ error: `Erro na API Gemini: ${data.error?.message || 'Desconhecido'}` }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: data.candidates?.[0]?.content 
    }), { headers: corsHeaders, status: 200 })

  } catch (error: any) {
    console.error("[chat-gemini] Erro não tratado:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})