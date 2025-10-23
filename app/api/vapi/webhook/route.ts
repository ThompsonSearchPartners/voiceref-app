import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK CALLED ===');
    
    const payload = await request.text();
    
    // Vapi sends the secret directly in x-vapi-secret header
    const vapiSecret = request.headers.get('x-vapi-secret');
    
    if (vapiSecret !== process.env.VAPI_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret. Expected:', process.env.VAPI_WEBHOOK_SECRET, 'Got:', vapiSecret);
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    const event = JSON.parse(payload);
    console.log('Vapi webhook event:', event.type, 'for call:', event.call?.id);

    switch (event.type) {
      case 'call.started':
        console.log('Handling call.started');
        await supabase
          .from('phone_reference_checks')
          .update({ 
            call_status: 'in_progress', 
            vapi_call_id: event.call.id 
          })
          .eq('vapi_assistant_id', event.call.assistantId);
        break;
        
      case 'call.ended':
        console.log('Handling call.ended, fetching transcript from Vapi...');
        
        const callResponse = await fetch(`https://api.vapi.ai/call/${event.call.id}`, {
          headers: { 
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}` 
          }
        });
        
        if (!callResponse.ok) {
          console.error('Failed to fetch call details from Vapi:', callResponse.status);
          break;
        }
        
        const callData = await callResponse.json();
        console.log('Got call data, duration:', callData.duration);
        
        // Update phone reference check
        const { data: phoneCheck, error: updateError } = await supabase
          .from('phone_reference_checks')
          .update({
            call_status: 'completed',
            call_duration_seconds: callData.duration,
            recording_url: callData.recordingUrl,
            transcript: callData.transcript
          })
          .eq('vapi_call_id', event.call.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Error updating phone check:', updateError);
          break;
        }
        
        if (phoneCheck) {
          console.log('Updated phone check:', phoneCheck.id);
          
          // Extract and save transcript text
          const transcriptText = (callData.transcript || [])
            .map((t: any) => {
              const speaker = t.role === 'assistant' ? 'AI' : 'Reference';
              const content = t.content || t.text || '';
              return `${speaker}: ${content}`;
            })
            .join('\n\n');
            
          const { error: transcriptError } = await supabase
            .from('call_transcripts')
            .insert({
              phone_reference_check_id: phoneCheck.id,
              transcript_text: transcriptText,
              transcript_json: callData.transcript
            });
            
          if (transcriptError) {
            console.error('Error saving transcript:', transcriptError);
          } else {
            console.log('Successfully saved transcript');
          }
        }
        break;
        
      case 'call.failed':
        console.log('Handling call.failed');
        await supabase
          .from('phone_reference_checks')
          .update({ call_status: 'failed' })
          .eq('vapi_call_id', event.call.id);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: String(error)
    }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
