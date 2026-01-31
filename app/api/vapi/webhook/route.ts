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
    const vapiSecret = request.headers.get('x-vapi-secret');
    if (vapiSecret !== process.env.VAPI_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret');
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
    
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

    if (eventType === 'call.ended' || eventType === 'end-of-call-report') {
      console.log('Processing call end for:', call.id);

      const callResponse = await fetch(`https://api.vapi.ai/call/${call.id}`, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
      });
      
      if (!callResponse.ok) {
        console.error('Failed to fetch call from Vapi:', callResponse.status);
        return NextResponse.json({ received: true });
      }

      const callData = await callResponse.json();
      console.log('Got call data from Vapi');
      
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
            const label = t.role === 'assistant' ? 'AI' : 'PERSON';
            lines.push(`${label}: ${message}`);
          }
        });
        rawTranscript = lines.join('\n');
      } else if (callData.messages && Array.isArray(callData.messages)) {
        const lines: string[] = [];
        callData.messages.forEach((m: any) => {
          const message = (m.content || m.text || m.message || '').trim();
          if (message) {
            const label = m.role === 'assistant' ? 'AI' : 'PERSON';
            lines.push(`${label}: ${message}`);
          }
        });
        rawTranscript = lines.join('\n');
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
                content: `You are converting a phone reference check transcript into a clean, professional format.

CRITICAL RULES:
1. Output ONLY the question and answer pairs - no introduction, no preamble, no summary
2. Start immediately with the first VoiceRef: question
3. Each question from the AI interviewer becomes "VoiceRef:" 
4. Each answer from the person becomes "Reference:"
5. VoiceRef and Reference should be on SEPARATE lines
6. Combine follow-up questions and their answers into single pairs when they're about the same topic
7. Clean up the answers - remove filler words (um, uh, yeah, you know), fix grammar, make complete sentences
8. Skip the greeting/intro - start with the first real reference question
9. Skip the goodbye at the end

FORMAT (follow exactly - VoiceRef and Reference on separate lines):
VoiceRef: [Question]
Reference: [Answer]

VoiceRef: [Question]
Reference: [Answer]

EXAMPLE OUTPUT:
VoiceRef: Can you describe your working relationship with the candidate?
Reference: He reported directly to me for three years. He was excellent - very strong technically and collaborated well with the team.

VoiceRef: What were their primary responsibilities?
Reference: He designed process automation equipment using SolidWorks, focusing on material handling systems for heavy industry.

VoiceRef: What would you say are their greatest strengths?
Reference: His technical skills and ability to understand complex engineering principles. He worked on a large project for a gold mining company involving material handling equipment for heavy industry.`
              },
              {
                role: "user",
                content: rawTranscript
              }
            ],
            temperature: 0.2,
            max_tokens: 3000
          });

          const aiResponse = completion.choices[0]?.message?.content;
          
          if (aiResponse && aiResponse.trim().length > 0) {
            formattedTranscript = aiResponse.trim();
            console.log('OpenAI formatting SUCCESS');
          } else {
            console.log('OpenAI returned empty response');
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
        
        // Format for HTML email - VoiceRef in blue, Reference in dark gray
        const htmlTranscript = formattedTranscript
          .split('\n\n')
          .map(block => {
            const lines = block.split('\n');
            let html = '';
            lines.forEach(line => {
              if (line.startsWith('VoiceRef:')) {
                const question = line.replace('VoiceRef:', '').trim();
                html += `<p style="margin: 0 0 4px 0; color: #2563eb; font-weight: 600;">VoiceRef: ${question}</p>`;
              } else if (line.startsWith('Reference:')) {
                const answer = line.replace('Reference:', '').trim();
                html += `<p style="margin: 0 0 24px 0; color: #374151;">Reference: ${answer}</p>`;
              }
            });
            return html;
          })
          .join('');
        
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Reference Check Completed</h2>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Reference:</strong> ${scheduledCall.reference_name}</p>
              <p style="margin: 5px 0;"><strong>Phone:</strong> ${scheduledCall.reference_phone}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${Math.round((callData.duration || callData.durationSeconds || 0) / 60)} minutes</p>
            </div>
            
            <h3 style="color: #1e40af; margin-top: 30px; margin-bottom: 20px;">Interview Transcript</h3>
            <div style="background: #ffffff; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px; line-height: 1.8;">
              ${htmlTranscript}
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
