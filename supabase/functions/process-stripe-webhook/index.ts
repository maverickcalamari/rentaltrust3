import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      throw new Error('Missing Stripe signature')
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Find the invoice by payment intent ID
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select(`
          id,
          amount,
          lease_id,
          leases (
            tenant_id,
            unit_id,
            units (
              unit_number,
              properties (
                name,
                organization_id
              )
            ),
            users (
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found for payment intent')
      }

      // Update invoice status to paid
      const { error: updateError } = await supabaseClient
        .from('invoices')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id)

      if (updateError) {
        throw updateError
      }

      // Create payment record
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          amount: paymentIntent.amount / 100, // Convert from cents
          payment_date: new Date().toISOString(),
          payment_method: paymentIntent.payment_method_types[0] || 'card',
          stripe_payment_intent_id: paymentIntent.id
        })

      if (paymentError) {
        throw paymentError
      }

      // Send receipt emails to tenant and landlord
      await supabaseClient.functions.invoke('send-payment-receipt', {
        body: {
          invoice,
          paymentIntent,
          amount: paymentIntent.amount / 100
        }
      })

      console.log(`Payment processed successfully for invoice ${invoice.id}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})