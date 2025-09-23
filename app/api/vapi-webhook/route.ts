import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Vapi sends different event types
    const { type, call } = payload
    
    // We're interested in the 'call.ended' event which has the transcript
    if (type === 'call.ended' && call) {
      const { id: callId, transcript, phoneNumber } = call
      
      // Find the reference by phone number
      const { data: reference } = await supabase
        .from('reference_contacts')
        .select('id, reference_checks(id)')
        .eq('phone', phoneNumber)
        .single()
      
      if (reference) {
        // Extract question-answer pairs from transcript
        const transcriptText = transcript?.messages
          ?.map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n') || JSON.stringify(transcript)
        
        // Save transcript to scheduled_calls
        await supabase
          .from('scheduled_calls')
          .update({
            call_completed: true,
            transcript: transcriptText,
            call_duration: call.duration || 0
          })
          .eq('reference_id', reference.id)
          .eq('call_completed', false)
        
        // Parse responses and save to responses table
        // Vapi transcript contains the conversation - we need to extract answers
        const messages = transcript?.messages || []
        const userMessages = messages.filter((m: any) => m.role === 'user')
        
        // Get the questions for this reference check
        const { data: questions } = await supabase
          .from('custom_questions')
          .select('id, text, order_num')
          .eq('check_id', reference.reference_checks.id)
          .order('order_num', { ascending: true })
        
        // Save each response
        if (questions && userMessages.length > 0) {
          const responseInserts = questions.map((question, index) => ({
            reference_id: reference.id,
            question_id: question.id,
            transcript: userMessages[index]?.content || '',
            sentiment_score: 0.8, // Placeholder - you could add sentiment analysis here
            sentiment_label: 'positive'
          }))
          
          await supabase
            .from('responses')
            .insert(responseInserts)
        }
        
        // Update reference status
        await supabase
          .from('reference_contacts')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', reference.id)
        
        // Check if all references are complete and generate report
        const { data: allRefs } = await supabase
          .from('reference_contacts')
          .select('status')
          .eq('check_id', reference.reference_checks.id)
        
        const allComplete = allRefs?.every(r => r.status === 'completed')
        
        if (allComplete) {
          await supabase
            .from('reference_checks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', reference.reference_checks.id)
        }
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
