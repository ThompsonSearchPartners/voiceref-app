import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

      // Get raw transcript
      let rawTranscript = '';
      
      if (callData.transcript && Array.isArray(callData.transcript)) {
        rawTranscript = callData.transcript
          .map((t: any) => {
            const role = t.role === 'assistant' ? 'AI' : 'Reference';
            const message = t.content || t.text || t.message || '';
            return `${role}: ${message}`;
          })
          .join('\n');
      } else if (callData.messages && Array.isArray(callData.messages)) {
        rawTranscript = callData.messages
          .map((m: any) => {
            const role = m.role === 'assistant' ? 'AI' : 'Reference';
            const message = m.content || m.text || m.message || '';
            return `${role}: ${message}`;
          })
          .join('\n');
      } else if (call.transcript) {
        rawTranscript = typeof call.transcript === 'string' ? call.transcript : JSON.stringify(call.transcript);
      }

      console.log('Raw transcript length:', rawTranscript.length);

      // Format transcript with AI
      let formattedTranscript = rawTranscript;
      
      if (rawTranscript && rawTranscript.length > 50) {
        try {
          console.log('Formatting transcript with AI...');
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are formatting a professional reference check transcript. Follow these rules:

1. Present it as a clean Q&A format with clear questions and answers
2. Use this exact format for each exchange:

Q: [The question that was asked]
A: [The reference's complete answer]

3. Add a blank line between each Q&A pair for readability
4. Remove any filler words, "um", "uh", repetitions, or conversational noise
5. Keep the substance and meaning of all responses intact
6. Start directly with the first Q: - no introduction or preamble
7. If the AI introduced itself or had opening pleasantries, summarize that briefly at the top

Make it professional, easy to scan, and well-organized.`
              },
              {
                role: "user",
                content: rawTranscript
              }
            ],
            temperature: 0.3
          });

          formattedTranscript = completion.choices[0]?.message?.content || rawTranscript;
          console.log('Transcript formatted successfully');
        } catch (aiError) {
          console.error('AI formatting error:', aiError);
          // Fall back to raw transcript if AI fails
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scheduled_calls')
        .update({
          call_completed: true,
          call_duration: callData.duration || callData.durationSeconds || 0,
          transcript: formattedTranscript || 'No transcript available',
          vapi_call_id: call.id
        })
        .eq('id', scheduledCall.id);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        console.log('Updated scheduled call:', scheduledCall.id);
      }

      // Send email with transcript
      if (formattedTranscript && formattedTranscript.length > 10) {
        console.log('Sending transcript email...');
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Reference Check Completed</h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Reference:</strong> ${scheduledCall.reference_name}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${scheduledCall.reference_phone}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${Math.round((callData.duration || callData.durationSeconds || 0) / 60)} minutes</p>
            </div>
            
            <h3 style="color: #1e40af; margin-top: 30px;">Transcript:</h3>
            <div style="background: #ffffff; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.8; white-space: pre-wrap;">
${formattedTranscript}
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
        console.log('No transcript to send');
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
