import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { scheduledTime, timezone } = await request.json()

    // Update reference with scheduled time and preferences
    const { error: updateError } = await supabase
      .from('reference_contacts')
      .update({
        preferred_contact_method: 'phone',
        scheduled_call_time: scheduledTime,
        call_status: 'scheduled',
        timezone: timezone
      })
      .eq('id', params.id)

    if (updateError) {
      throw updateError
    }

    // Create scheduled call record
    const { error: scheduleError } = await supabase
      .from('scheduled_calls')
      .insert({
        reference_id: params.id,
        scheduled_time: scheduledTime,
        call_completed: false
      })

    if (scheduleError) {
      throw scheduleError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Schedule call error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule call' },
      { status: 500 }
    )
  }
}
