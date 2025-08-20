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

    const today = new Date()
    const reminderTypes = [
      { type: '-3d', days: -3 }, // 3 days before due
      { type: '0d', days: 0 },   // Due date
      { type: '+3d', days: 3 },  // 3 days after due
      { type: '+7d', days: 7 },  // 7 days after due (apply late fee)
    ]

    let totalReminders = 0
    const errors = []

    for (const reminder of reminderTypes) {
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() - reminder.days)
      
      // Get invoices that need reminders
      const { data: invoices, error: invoicesError } = await supabaseClient
        .from('invoices')
        .select(`
          id,
          amount,
          due_date,
          late_fee,
          leases (
            tenant_id,
            units (
              unit_number,
              properties (
                name
              )
            ),
            users (
              email,
              phone,
              first_name,
              last_name
            )
          )
        `)
        .eq('status', reminder.days <= 0 ? 'pending' : 'overdue')
        .eq('due_date', targetDate.toISOString().split('T')[0])

      if (invoicesError) {
        errors.push(`Failed to fetch invoices for ${reminder.type}: ${invoicesError.message}`)
        continue
      }

      for (const invoice of invoices) {
        try {
          // Check if reminder already sent
          const { data: existingReminder } = await supabaseClient
            .from('reminder_history')
            .select('id')
            .eq('invoice_id', invoice.id)
            .eq('reminder_type', reminder.type)
            .single()

          if (existingReminder) {
            continue // Skip if reminder already sent
          }

          // Apply late fee for +7d reminder
          if (reminder.type === '+7d' && invoice.late_fee === 0) {
            const lateFee = Math.min(invoice.amount * 0.05, 50) // 5% or $50 max
            
            await supabaseClient
              .from('invoices')
              .update({ 
                late_fee: lateFee,
                amount: invoice.amount + lateFee,
                status: 'overdue'
              })
              .eq('id', invoice.id)
          }

          // Send email reminder
          const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
            body: {
              to: invoice.leases.users.email,
              subject: `Payment Reminder - ${invoice.leases.units.properties.name}`,
              template: 'payment-reminder',
              data: {
                tenantName: `${invoice.leases.users.first_name} ${invoice.leases.users.last_name}`,
                propertyName: invoice.leases.units.properties.name,
                unitNumber: invoice.leases.units.unit_number,
                amount: invoice.amount,
                dueDate: invoice.due_date,
                reminderType: reminder.type,
                isOverdue: reminder.days > 0,
                lateFee: invoice.late_fee
              }
            }
          })

          // Send SMS reminder if phone number available
          let smsStatus = 'skipped'
          if (invoice.leases.users.phone && reminder.days >= 0) {
            const { error: smsError } = await supabaseClient.functions.invoke('send-sms', {
              body: {
                to: invoice.leases.users.phone,
                message: `Rent reminder: $${invoice.amount} ${reminder.days === 0 ? 'due today' : `overdue by ${reminder.days} days`} for ${invoice.leases.units.properties.name} Unit ${invoice.leases.units.unit_number}. Pay online at [payment_link]`
              }
            })
            smsStatus = smsError ? 'failed' : 'sent'
          }

          // Record reminder history
          await supabaseClient
            .from('reminder_history')
            .insert({
              invoice_id: invoice.id,
              reminder_type: reminder.type,
              method: 'email',
              status: emailError ? 'failed' : 'sent'
            })

          if (smsStatus !== 'skipped') {
            await supabaseClient
              .from('reminder_history')
              .insert({
                invoice_id: invoice.id,
                reminder_type: reminder.type,
                method: 'sms',
                status: smsStatus
              })
          }

          totalReminders++

        } catch (error) {
          errors.push(`Failed to send reminder for invoice ${invoice.id}: ${error.message}`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: totalReminders,
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