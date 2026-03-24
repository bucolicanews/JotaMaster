import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Validar Usuário
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { packageId } = await req.json()

    // 2. Buscar Dados do Pacote e Configurações do PagBank
    const { data: pkg } = await supabaseClient.from('credit_packages').select('*').eq('id', packageId).single()
    const { data: settings } = await supabaseClient.from('system_settings').select('*').eq('id', 'global_config').single()

    if (!pkg || !settings) throw new Error("Configurações incompletas.")

    const isProd = settings.pagbank_env === 'production'
    const token = isProd ? settings.pagbank_token_production : settings.pagbank_token_sandbox
    const baseUrl = isProd ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com'

    // 3. Criar Pedido no PagBank (Exemplo simplificado de Checkout)
    const referenceId = crypto.randomUUID()
    
    const pagbankPayload = {
      reference_id: referenceId,
      customer: {
        name: user.user_metadata?.first_name || "Cliente JOTA",
        email: user.email,
        tax_id: "12345678909", // Idealmente pegar do perfil
        phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }]
      },
      items: [{
        reference_id: pkg.id,
        name: `Recarga JOTA: ${pkg.name}`,
        quantity: 1,
        unit_amount: Math.round(Number(pkg.price_brl) * 100) // PagBank usa centavos
      }],
      notification_urls: [`${Deno.env.get('SUPABASE_URL')}/functions/v1/pagbank-webhook`]
    }

    const response = await fetch(`${baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pagbankPayload)
    })

    const result = await response.json()
    
    // Registrar intenção de pagamento
    await supabaseClient.from('credit_transactions').insert({
      user_id: user.id,
      amount: pkg.credits_amount,
      type: 'purchase',
      description: `Início de compra: ${pkg.name}`,
      reference_id: referenceId
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})