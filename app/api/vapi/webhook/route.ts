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
    console.log('Full event:', JSON.stringify(event, null, 2));

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
      console.log('Call data keys:', Object.keys(callData));
      console.log('Transcript exists?', !!callData.transcript);
      console.log('Messages exists?', !!callData.messages);
      
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

      // Format transcript - try multiple possible formats
      let transcriptText = '';
      
      // Try callData.transcript first
      if (callData.transcript && Array.isArray(callData.transcript)) {
        console.log('Using callData.transcript format');
        transcriptText = callData.transcript
          .map((t: any) => `${t.role === 'assistant' ? 'AI' : 'Reference'}: ${t.content || t.text || t.message || ''}`)
          .join('\n\n');
      }
      // Try callData.messages
      else if (callData.messages && Array.isArray(callData.messages)) {
        console.log('Using callData.messages format');
        transcriptText = callData.messages
          .map((m: any) => `${m.role === 'assistant' ? 'AI' : 'Reference'}: ${m.content || m.text || m.message || ''}`)
          .join('\n\n');
      }
      // Try call.transcript
      else if (call.transcript) {
        console.log('Using call.transcript format');
        transcriptText = typeof call.transcript === 'string' ? call.transcript : JSON.stringify(call.transcript, null, 2);
      }

      console.log('Transcript length:', transcriptText.length);

      // Update database
      const { error: updateError } = await supabase
        .from('scheduled_calls')
        .update({
          call_completed: true,
          call_duration: callData.duration || callData.durationSeconds || 0,
          transcript: transcriptText || 'No transcript available',
          vapi_call_id: call.id
        })
        .eq('id', scheduledCall.id);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log('Updated scheduled call:', scheduledCall.id);
      }

      // Send email with transcript
      if (transcriptText && transcriptText.length > 10) {
        console.log('Sending transcript email...');
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reference Check Completed</h2>
            
            <p><strong>Reference:</strong> ${scheduledCall.reference_name}</p>
            <p><strong>Phone:</strong> ${scheduledCall.reference_phone}</p>
            <p><strong>Duration:</strong> ${Math.round((callData.duration || callData.durationSeconds || 0) / 60)} minutes</p>
            
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
              to: 'conor@thompsonsearchpartners.com',
              subject: `Reference Check Completed - ${scheduledCall.reference_name}`,
              html: emailBody,
            }),
          });

          if (emailResponse.ok) {
            console.log('Email sent successfully');
          } else {
            const errorText = await emailResponse.text();
            console.error('Email send failed:', emailResponse.status, errorText);
          }
        } catch (emailError) {
          console.error('Email error:', emailError);
        }
      } else {
        console.log('No transcript to send, length:', transcriptText.length);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
