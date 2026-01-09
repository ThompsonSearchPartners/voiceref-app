import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { referenceCheckId, referenceName, referencePhone, referenceEmail, scheduledTime, questions, candidateName } = await request.json();
    
    if (!referenceCheckId || !referenceName || !referencePhone || !scheduledTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedPhone = referencePhone.startsWith('+') ? referencePhone : `+1${referencePhone.replace(/\D/g, '')}`;
    
    // Create Vapi Assistant
    const questionsText = questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
    
    const systemPrompt = `You are conducting a professional employment reference check for ${candidateName || 'the candidate'}. You are speaking with ${referenceName}.

Your objectives:
1. Introduce yourself professionally and warmly
2. Confirm they have 10-15 minutes for the reference check
3. Ask each of the following questions ONE AT A TIME
4. Listen carefully and ask natural follow-up questions when appropriate
5. Be conversational and empathetic
6. Thank them warmly at the end

Questions to ask:
${questionsText}

Keep the tone professional but friendly. Make them feel comfortable sharing honest feedback.`;

    const assistantResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Ref Check - ${referenceName}`,
        model: { provider: 'openai', model: 'gpt-4', temperature: 0.7, systemPrompt },
        voice: { provider: 'openai', voiceId: 'alloy' },
        firstMessage: `Hi ${referenceName}, this is an automated reference check system calling on behalf of ${candidateName || 'a candidate'}'s job application. Do you have about 10 to 15 minutes to speak with me?`,
        recordingEnabled: true,
        endCallFunctionEnabled: true,
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
      })
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error('Vapi assistant creation failed:', assistantResponse.status, errorText);
      throw new Error(`Failed to create Vapi assistant: ${assistantResponse.status} - ${errorText}`);
    }
    
    const assistant = await assistantResponse.json();

    // Store in database
    const { data: phoneCheck, error: dbError } = await supabase
      .from('scheduled_calls')
      .insert({
        reference_id: null,
        reference_name: referenceName,
        reference_phone: formattedPhone,
        reference_email: referenceEmail,
        scheduled_time: scheduledTime,
        vapi_assistant_id: assistant.id,
        call_status: 'scheduled',
        call_completed: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', JSON.stringify(dbError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to create phone reference check',
        details: dbError.message 
      }, { status: 500 });
    }

    console.log('Successfully created scheduled call:', phoneCheck);

    return NextResponse.json({ 
      success: true, 
      scheduledCallId: phoneCheck.id, 
      scheduledTime 
    });

  } catch (error: any) {
    console.error('Error scheduling call:', error);
    return NextResponse.json({ error: error.message || 'Failed to schedule call' }, { status: 500 });
  }
}
