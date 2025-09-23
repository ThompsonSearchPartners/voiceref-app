import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { scheduleVapiCall } from '../../../lib/vapi-ai'

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    const { data: scheduledCalls, error } = await supabase
      .from('scheduled_calls')
      .select(`
        id,
        scheduled_time,
        reference_contacts (
          id,
          name,
          phone,
          reference_checks (
            id,
            candidate_name,
            position
          )
        )
      `)
      .eq('call_completed', false)
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', oneHourFromNow.toISOString())

    if (error) throw error

    for (const call of scheduledCalls || []) {
      const { data: questions } = await supabase
        .from('custom_questions')
        .select('text, order_num')
        .eq('check_id', call.reference_contacts.reference_checks.id)
        .order('order_num', { ascending: true })

      if (questions && call.reference_contacts.phone) {
        const questionTexts = questions.map(q => q.text)
        
        const result = await scheduleVapiCall(
          call.reference_contacts.phone,
          questionTexts,
          call.reference_contacts.reference_checks.candidate_name,
          call.reference_contacts.reference_checks.position
        )

        if (result.success) {
          await supabase
            .from('scheduled_calls')
            .update({ bland_call_id: result.callId })
            .eq('id', call.id)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: scheduledCalls?.length || 0 
    })
  } catch (error) {
    console.error('Trigger calls error:', error)
    return NextResponse.json(
      { error: 'Failed to trigger calls' },
      { status: 500 }
    )
  }
}
