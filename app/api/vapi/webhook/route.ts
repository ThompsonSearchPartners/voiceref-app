import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: string, signature: string): boolean {
  if (!process.env.VAPI_WEBHOOK_SECRET) return false;
  const hmac = crypto.createHmac('sha256', process.env.VAPI_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK CALLED ===');
    console.log('Headers:', Object.fromEntries(request.headers));
    
    const payload = await request.text();
    console.log('Payload:', payload);
    
    const signature = request.headers.get('x-vapi-signature');
    
    // Temporarily skip signature verification for testing
    // if (signature && !verifySignature(payload, signature)) {
    //   console.error('Invalid webhook signature');
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    const event = JSON.parse(payload);
    console.log('Vapi webhook event:', event.type);

    switch (event.type) {
      case 'call.started':
        console.log('Handling call.started for call:', event.call?.id);
        await supabase
          .from('phone_reference_checks')
          .update({ call_status: 'in_progress', vapi_call_id: event.call.id })
          .eq('vapi_assistant_id', event.call.assistantId);
        break;
        
      case 'call.ended':
        console.log('Handling call.ended for call:', event.call?.id);
        const callResponse = await fetch(`https://api.vapi.ai/call/${event.call.id}`, {
          headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
        });
        
        if (!callResponse.ok) {
          console.error('Failed to fetch call details from Vapi');
          break;
        }
        
        const callData = await callResponse.json();
        console.log('Got call data from Vapi');
        
        const { data: phoneCheck } = await supabase
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
          
        if (phoneCheck) {
          console.log('Updated phone check:', phoneCheck.id);
          
          const transcriptText = (callData.transcript || [])
            .map((t: any) => `${t.role === 'assistant' ? 'AI' : 'Reference'}: ${t.content || t.text || ''}`)
            .join('\n\n');
            
          await supabase.from('call_transcripts').insert({
            phone_reference_check_id: phoneCheck.id,
            transcript_text: transcriptText,
            transcript_json: callData.transcript
          });
          
          console.log('Saved transcript');
        }
        break;
        
      case 'call.failed':
        console.log('Handling call.failed for call:', event.call?.id);
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
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
