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
        const lines: string[] = [];
        callData.transcript.forEach((t: any) => {
          const message = (t.content || t.text || t.message || '').trim();
          if (message) {
            const label = t.role === 'assistant' ? 'INTERVIEWER' : 'REFERENCE';
            lines.push(`${label}: ${message}`);
          }
        });
        rawTranscript = lines.join('\n\n');
      } else if (callData.messages && Array.isArray(callData.messages)) {
        const lines: string[] = [];
        callData.messages.forEach((m: any) => {
          const message = (m.content || m.text || m.message || '').trim();
          if (message) {
            const label = m.role === 'assistant' ? 'INTERVIEWER' : 'REFERENCE';
            lines.push(`${label}: ${message}`);
          }
        });
        rawTranscript = lines.join('\n\n');
      } else if (call.transcript) {
        rawTranscript = typeof call.transcript === 'string' ? call.transcript : JSON.stringify(call.transcript);
      }

      console.log('Raw transcript length:', rawTranscript.length);

      // Format transcript with AI
      let formattedTranscript = 'No transcript available';
      
      if (rawTranscript && rawTranscript.length > 50) {
        try {
          console.log('Calling OpenAI to format transcript...');
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are formatting a professional reference check transcript into a clean Q&A format.

RULES:
1. Extract each question asked by the INTERVIEWER
2. Extract the corresponding answer from the REFERENCE
3. Format as:

Q: [Question text]
A: [Answer text]

Q: [Next question]
A: [Next answer]

4. Remove filler words (um, uh, you know)
5. Clean up grammar but keep the meaning
6. Skip the introduction/greeting - start with the first real question
7. Each Q&A pair should be separated by a blank line
8. Make answers complete sentences when possible`
              },
              {
                role: "user",
                content: rawTranscript
              }
            ],
            temperature: 0.3,
            max_tokens: 3000
          });

          const aiResponse = completion.choices[0]?.message?.content;
          
          if (aiResponse && aiResponse.trim().length > 0) {
            formattedTranscript = aiResponse.trim();
            console.log('OpenAI formatting SUCCESS');
          } else {
            console.log('OpenAI returned empty response, using raw transcript');
            formattedTranscript = rawTranscript;
          }
          
        } catch (aiError: any) {
          console.error('OpenAI formatting ERROR:', aiError.message);
          formattedTranscript = rawTranscript;
        }
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scheduled_calls')
        .update({
          call_completed: true,
          call_duration: callData.duration || callData.durationSeconds || 0,
          transcript: formattedTranscript,
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
        
        // Convert line breaks to HTML for email
        const htmlTranscript = formattedTranscript
          .replace(/\n\n/g, '</p><p style="margin: 16px 0;">')
          .replace(/\n/g, '<br>')
          .replace(/^Q:/gm, '<strong>Q:</strong>')
          .replace(/^A:/gm, '<strong>A:</strong>');
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Reference Check Completed</h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Reference:</strong> ${scheduledCall.reference_name}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${scheduledCall.reference_phone}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${Math.round((callData.duration || callData.durationSeconds || 0) / 60)} minutes</p>
            </div>
            
            <h3 style="color: #1e40af; margin-top: 30px;">Transcript</h3>
            <div style="background: #ffffff; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.8;">
              <p style="margin: 16px 0;">${htmlTranscript}</p>
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
              from: 'VoiceRef <noreply@voiceref.io>',
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
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true });
  }
}
