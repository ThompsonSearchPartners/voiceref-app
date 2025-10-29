import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get secret from header
    const vapiSecret = request.headers.get('x-vapi-secret');
    if (vapiSecret !== process.env.VAPI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    // Parse body - handle both text and JSON
    let event;
    try {
      event = await request.json(); // Try JSON first
    } catch {
      const text = await request.text();
      event = JSON.parse(text); // Fallback to text
    }

    const eventType = event.type || event.message?.type;
    const call = event.call || event.message?.call;
    
    if (!call?.id) {
      return NextResponse.json({ received: true }); // Ignore events without call
    }

    // Handle call.ended - the only one we care about
    if (eventType === 'call.ended' || eventType === 'end-of-call-report') {
      // Fetch full transcript from Vapi
      const callResponse = await fetch(`https://api.vapi.ai/call/${call.id}`, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
      });
      
      if (callResponse.ok) {
        const callData = await callResponse.json();
        
        // Update database
        const { data: phoneCheck } = await supabase
          .from('phone_reference_checks')
          .update({
            call_status: 'completed',
            call_duration_seconds: callData.duration || 0,
            recording_url: callData.recordingUrl,
            transcript: callData.transcript
          })
          .eq('vapi_call_id', call.id)
          .select()
          .single();
          
        // Save transcript
        if (phoneCheck && callData.transcript) {
          const transcriptText = callData.transcript
            .map((t: any) => `${t.role === 'assistant' ? 'AI' : 'Reference'}: ${t.content || t.text || ''}`)
            .join('\n\n');
            
          await supabase.from('call_transcripts').insert({
            phone_reference_check_id: phoneCheck.id,
            transcript_text: transcriptText,
            transcript_json: callData.transcript
          });
        }
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ received: true }); // Always return 200
  }
}
