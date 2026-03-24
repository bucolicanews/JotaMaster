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

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { packageId, paymentMethod } = await req.json() // paymentMethod: 'pix' ou 'CREDIT_CARD'

    const { data: pkg } = await supabaseClient.from('credit_packages').select('*').eq('id', packageId).single()
    const { data: settings } = await supabaseClient.from('system_settings').select('*').eq('id', 'global_config').single()

    if (!pkg || !settings) throw new Error("Configurações incompletas.")

    // --- LÓGICA DE TAXAS ---
    let baseAmount = Number(pkg.price_brl);
    let finalAmount = baseAmount;

    if (settings.pagbank_pass_fees_to_customer) {
      const isPix = paymentMethod === 'pix';
      const fixed = isPix ? Number(settings.pagbank_pix_fee_fixed || 0) : Number(settings.pagbank_card_fee_fixed || 0);
      const percent = isPix ? Number(settings.pagbank_pix_fee_percentage || 0) : Number(settings.pagbank_card_fee_percentage || 0);
      
      // Fórmula para garantir que o lojista receba o valor base: (Base + Fixo) / (1 - %)
      finalAmount = (baseAmount + fixed) / (1 - (percent / 100));
    }

    const amountCents = Math.round(finalAmount * 100);
    // -----------------------

    const isProd = settings.pagbank_env === 'production'
    const token = isProd ? settings.pagbank_token_production : settings.pagbank_token_sandbox
    const baseUrl = isProd ? 'https://api.pagseguro.com' : 'https://sandbox.api.pagseguro.com'

    const referenceId = crypto.randomUUID()
    
    await supabaseClient.from('pagbank_payments').insert({
      user_id: user.id,
      reference_id: referenceId,
      amount_cents: amountCents,
      credits_to_add: pkg.credits_amount,
      status: 'PENDING'
    })

    const pagbankPayload = {
      reference_id: referenceId,
      customer: {
        name: user.user_metadata?.first_name || "Cliente JOTA",
        email: user.email,
        tax_id: "12345678909", 
        phones: [{ country: "55", area: "11", number: "999999999", type: "MOBILE" }]
      },
      items: [{
        reference_id: pkg.id,
        name: `Recarga JOTA: ${pkg.name}`,
        quantity: 1,
        unit_amount: amountCents
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