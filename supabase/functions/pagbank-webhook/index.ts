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

    const payload = await req.json()
    console.log("[PagBank Webhook] Notificação recebida:", payload)

    // 1. Extrair ID de Referência (Pode vir em locais diferentes dependendo do evento)
    const referenceId = payload.reference_id || payload.charges?.[0]?.reference_id
    const status = payload.status || payload.charges?.[0]?.status

    if (!referenceId) throw new Error("Reference ID não localizado no payload.")

    // 2. Buscar o registro do pagamento no nosso banco
    const { data: payment, error: fetchError } = await supabaseClient
      .from('pagbank_payments')
      .select('*')
      .eq('reference_id', referenceId)
      .single()

    if (fetchError || !payment) {
      console.error("[PagBank Webhook] Pagamento não encontrado para ref:", referenceId)
      return new Response('Payment not found', { status: 200 }) // Retornamos 200 para o PagBank parar de tentar
    }

    // 3. Verificar Idempotência (Se já foi pago, não faz nada)
    if (payment.status === 'PAID') {
      return new Response('Already processed', { status: 200 })
    }

    // 4. Se o status for PAGO, libera os créditos
    if (status === 'PAID' || status === 'COMPLETED' || status === 'AUTHORIZED') {
      
      // Inicia Transação de Crédito
      const { error: walletError } = await supabaseClient.rpc('increment_wallet_balance', {
        p_user_id: payment.user_id,
        p_amount: payment.credits_to_add
      })

      if (walletError) throw walletError

      // Atualiza status do pagamento
      await supabaseClient
        .from('pagbank_payments')
        .update({ 
          status: 'PAID', 
          raw_payload: payload,
          updated_at: new Date().toISOString() 
        })
        .eq('id', payment.id)

      // Registra no histórico oficial de transações
      await supabaseClient.from('credit_transactions').insert({
        user_id: payment.user_id,
        amount: payment.credits_to_add,
        type: 'purchase',
        description: `Créditos liberados via PagBank (Ref: ${referenceId})`,
        reference_id: referenceId
      })

      console.log(`[PagBank Webhook] Sucesso: ${payment.credits_to_add} créditos adicionados ao usuário ${payment.user_id}`)
    } else {
      // Apenas atualiza o status (ex: CANCELED, DECLINED)
      await supabaseClient
        .from('pagbank_payments')
        .update({ status: status, raw_payload: payload })
        .eq('id', payment.id)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("[PagBank Webhook] Erro crítico:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})