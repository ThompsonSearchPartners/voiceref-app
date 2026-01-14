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
      console.error('Invalid webhook secret');
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
    // Parse body
    let event;
    try {
      event = await request.json();
    } catch {
      const text = await request.text();
      event = JSON.parse(text);
    }

    console.log('Vapi webhook event:', event.type);

    const eventType = event.type || event.message?.type;
    const call = event.call || event.message?.call;
    
    if (!call?.id) {
      console.log('No call ID in event, ignoring');
      return NextResponse.json({ received: true });
    }

    // Handle call.ended
    if (eventType === 'call.ended' || eventType === 'end-of-call-report') {
      console.log('Processing call end for:', call.id);

      // Fetch full call data from Vapi
      const callResponse = await fetch(`https://api.vapi.ai/call/${call.id}`, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
      });
      
      if (!callResponse.ok) {
        console.error('Failed to fetch call from Vapi:', callResponse.status);
        return NextResponse.json({ received: true });
      }

      const callData = await callResponse.json();
      console.log('Got call data from Vapi');
      
      // Find the scheduled call in database
      const { data: scheduledCall, error: findError } = await supabase
        .from('scheduled_calls')
        .select('*')
        .eq('vapi_call_id', call.id)
        .single();

      if (findError || !scheduledCall) {
        console.error('Could not find scheduled call:', findError);
        return NextResponse.json({ received: true });
      }

      // Format transcript
      let transcriptText = '';
      if (callData.transcript && Array.isArray(callData.transcript)) {
        transcriptText = callData.transcript
          .map((t: any) => `${t.role === 'assistant' ? 'AI' : 'Reference'}: ${t.content || t.text || ''}`)
          .join('\n\n');
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scheduled_calls')
        .update({
          call_completed: true,
          call_duration: callData.duration || 0,
          transcript: transcriptText,
          vapi_call_id: call.id
        })
        .eq('id', scheduledCall.id);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log('Updated scheduled call:', scheduledCall.id);
      }

      // Send email with transcript
      if (transcriptText) {
        console.log('Sending transcript email...');
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reference Check Completed</h2>
            
            <p><strong>Reference:</strong> ${scheduledCall.reference_name}</p>
            <p><strong>Phone:</strong> ${scheduledCall.reference_phone}</p>
            <p><strong>Duration:</strong> ${Math.round((callData.duration || 0) / 60)} minutes</p>
            
            <h3>Transcript:</h3>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap;">
${transcriptText}
            </div>
          </div>
        `;

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'VoiceRef <onboarding@resend.dev>',
              to: 'conor@thompsonsearchpartners.com', // Your email
              subject: `Reference Check Completed - ${scheduledCall.reference_name}`,
              html: emailBody,
            }),
          });

          if (emailResponse.ok) {
            console.log('Email sent successfully');
          } else {
            console.error('Email send failed:', await emailResponse.text());
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
        }
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true }); // Always return 200 to Vapi
  }
}
