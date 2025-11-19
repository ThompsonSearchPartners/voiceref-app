
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referenceCheckId,
      phoneNumber,
      scheduledTime,
      customQuestions = [],
      candidateData,
      referenceData,
    } = body;

    // Validate required fields
    if (!phoneNumber || !scheduledTime) {
      return NextResponse.json(
        { error: 'Phone number and scheduled time are required' },
        { status: 400 }
      );
    }

    let finalReferenceCheckId = referenceCheckId;

    // If no referenceCheckId provided, create a new reference check
    if (!finalReferenceCheckId && candidateData && referenceData) {
      // First, create or get the reference check record
      const { data: checkData, error: checkError } = await supabase
        .from('reference_checks')
        .insert({
          candidate_name: candidateData.name,
          candidate_email: candidateData.email,
          position: candidateData.position,
          job_description: candidateData.jobDescription,
          hiring_manager: candidateData.hiringManager,
          company: candidateData.company,
          status: 'pending',
        })
        .select()
        .single();

      if (checkError) {
        console.error('Error creating reference check:', checkError);
        return NextResponse.json(
          { error: 'Failed to create reference check' },
          { status: 500 }
        );
      }

      finalReferenceCheckId = checkData.id;

      // Create the reference record
      const { error: refError } = await supabase
        .from('references')
        .insert({
          check_id: finalReferenceCheckId,
          name: referenceData.name,
          email: referenceData.email,
          phone: referenceData.phone,
          status: 'pending',
        });

      if (refError) {
        console.error('Error creating reference:', refError);
        return NextResponse.json(
          { error: 'Failed to create reference' },
          { status: 500 }
        );
      }
    }

    // Validate that we have a reference check ID
    if (!finalReferenceCheckId) {
      return NextResponse.json(
        { error: 'Reference check ID is required' },
        { status: 400 }
      );
    }

    // Get reference check and questions
    const { data: referenceCheck, error: fetchError } = await supabase
      .from('reference_checks')
      .select('*, references(*), questions(*)')
      .eq('id', finalReferenceCheckId)
      .single();

    if (fetchError || !referenceCheck) {
      console.error('Error fetching reference check:', fetchError);
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      );
    }

    // Create the phone reference check record
    const { data: phoneCheck, error: phoneCheckError } = await supabase
      .from('phone_reference_checks')
      .insert({
        reference_check_id: finalReferenceCheckId,
        phone_number: phoneNumber,
        scheduled_time: scheduledTime,
        status: 'scheduled',
        referee_name: referenceData?.name || referenceCheck.references?.[0]?.name,
        referee_email: referenceData?.email || referenceCheck.references?.[0]?.email,
        metadata: {
          custom_questions: customQuestions,
          candidate_name: candidateData?.name || referenceCheck.candidate_name,
          position: candidateData?.position || referenceCheck.position,
          job_description: candidateData?.jobDescription || referenceCheck.job_description,
        },
      })
      .select()
      .single();

    if (phoneCheckError) {
      console.error('Error creating phone check:', phoneCheckError);
      return NextResponse.json(
        { error: 'Failed to schedule phone call' },
        { status: 500 }
      );
    }

    // Prepare questions for VAPI assistant
    const standardQuestions = referenceCheck.questions?.map((q: any) => q.text) || [];
    const allQuestions = [...standardQuestions, ...customQuestions.filter((q: string) => q.trim())];

    // Create VAPI assistant with custom questions
    const vapiAssistant = await createVAPIAssistant({
      candidateName: candidateData?.name || referenceCheck.candidate_name,
      position: candidateData?.position || referenceCheck.position,
      refereeName: referenceData?.name || referenceCheck.references?.[0]?.name,
      questions: allQuestions,
      phoneCheckId: phoneCheck.id,
    });

    // Update phone check with VAPI assistant ID
    await supabase
      .from('phone_reference_checks')
      .update({ vapi_assistant_id: vapiAssistant.id })
      .eq('id', phoneCheck.id);

    return NextResponse.json({
      success: true,
      phoneCheckId: phoneCheck.id,
      referenceCheckId: finalReferenceCheckId,
      scheduledTime: scheduledTime,
      message: 'Phone call scheduled successfully',
    });
  } catch (error) {
    console.error('Error scheduling phone check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createVAPIAssistant({
  candidateName,
  position,
  refereeName,
  questions,
  phoneCheckId,
}: {
  candidateName: string;
  position: string;
  refereeName: string;
  questions: string[];
  phoneCheckId: string;
}) {
  const questionsText = questions
    .map((q, i) => `${i + 1}. ${q}`)
    .join('\n');

  const systemPrompt = `You are conducting a professional reference check phone interview.

CANDIDATE INFORMATION:
- Name: ${candidateName}
- Position: ${position}

REFERENCE CONTACT:
- Name: ${refereeName}

YOUR TASK:
1. Introduce yourself professionally
2. Confirm you're speaking with ${refereeName}
3. Ask for consent to proceed with the reference check
4. Ask each of these questions and listen carefully to responses:

${questionsText}

5. Thank them for their time

IMPORTANT:
- Be professional and conversational
- Allow natural responses
- Ask relevant follow-up questions if needed
- Keep the interview focused but friendly
- Total interview should be 10-20 minutes`;

  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Reference Check - ${candidateName}`,
      model: {
        provider: 'openai',
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: 'IKne3meq5aSn9XLyUdCD', // Professional female voice
      },
      firstMessage: `Hi, this is calling from VoiceRef. I'm conducting a reference check for ${candidateName}. Am I speaking with ${refereeName}?`,
      serverUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/vapi`,
      serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      endCallFunctionEnabled: true,
      recordingEnabled: true,
      metadata: {
        phoneCheckId,
        candidateName,
        position,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('VAPI error:', error);
    throw new Error('Failed to create VAPI assistant');
  }

  return response.json();
}
