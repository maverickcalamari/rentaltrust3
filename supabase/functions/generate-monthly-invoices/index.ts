import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { runDate } = await req.json()
    const targetDate = new Date(runDate || new Date())
    const currentDay = targetDate.getDate()

    // Get all active leases where rent is due today
    const { data: leases, error: leasesError } = await supabaseClient
      .from('leases')
      .select(`
        id,
        tenant_id,
        unit_id,
        monthly_rent,
        rent_due_day,
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
      `)
      .eq('status', 'active')
      .eq('rent_due_day', currentDay)
      .lte('start_date', targetDate.toISOString().split('T')[0])
      .gte('end_date', targetDate.toISOString().split('T')[0])

    if (leasesError) {
      throw leasesError
    }

    let invoicesCreated = 0
    const errors = []

    for (const lease of leases) {
      try {
        // Calculate period dates
        const periodStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        const periodEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
        const dueDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), lease.rent_due_day)

        // Check if invoice already exists for this period
        const { data: existingInvoice } = await supabaseClient
          .from('invoices')
          .select('id')
          .eq('lease_id', lease.id)
          .eq('period_start', periodStart.toISOString().split('T')[0])
          .eq('period_end', periodEnd.toISOString().split('T')[0])
          .single()

        if (existingInvoice) {
          continue // Skip if invoice already exists
        }

        // Create new invoice
        const { error: invoiceError } = await supabaseClient
          .from('invoices')
          .insert({
            lease_id: lease.id,
            amount: lease.monthly_rent,
            due_date: dueDate.toISOString().split('T')[0],
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            status: 'pending'
          })

        if (invoiceError) {
          errors.push(`Failed to create invoice for lease ${lease.id}: ${invoiceError.message}`)
          continue
        }

        invoicesCreated++

        // Send notification email to tenant
        await supabaseClient.functions.invoke('send-invoice-notification', {
          body: {
            tenantEmail: lease.users.email,
            tenantName: `${lease.users.first_name} ${lease.users.last_name}`,
            propertyName: lease.units.properties.name,
            unitNumber: lease.units.unit_number,
            amount: lease.monthly_rent,
            dueDate: dueDate.toISOString().split('T')[0]
          }
        })

      } catch (error) {
        errors.push(`Error processing lease ${lease.id}: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoicesCreated,
        leasesProcessed: leases.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})