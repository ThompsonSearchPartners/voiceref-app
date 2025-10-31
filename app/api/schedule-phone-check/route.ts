import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VAPI_API_KEY = '22fe7d9a-288d-4946-a020-6aa8581bb251';
const VAPI_PHONE_NUMBER_ID = '88a8d0a5-f407-4198-a1ab-8b9c5fd1a7b7';

// STANDARD QUESTIONS - Always asked for every reference check
const STANDARD_QUESTIONS = [
  "How long did you work with this candidate?",
  "What were their primary responsibilities in their role?",
  "What were their key strengths?",
  "What areas could they improve in?",
  "How would you describe their work ethic and reliability?",
  "Would you hire them again? Why or why not?",
  "Is there anything else we should know about this candidate?"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referenceCheckId,
      phoneNumber,
      scheduledTime,
      refereeEmail,
      refereeName,
      jobDescription, // NEW: optional job description
      customQuestions, // NEW: optional array of custom questions
    } = body;

    // Validate required fields
    if (!referenceCheckId || !phoneNumber || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate phone number format (should be +1XXXXXXXXXX)
    if (!/^\+1\d{10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be +1XXXXXXXXXX' },
        { status: 400 }
      );
    }

    // Get reference check details from database
    const { data: refCheck, error: refCheckError } = await supabase
      .from('reference_checks')
      .select('*')
      .eq('id', referenceCheckId)
      .single();

    if (refCheckError || !refCheck) {
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      );
    }

    // Combine standard questions with custom questions
    const allQuestions = [...STANDARD_QUESTIONS];
    
    // Add custom questions if provided
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      allQuestions.push(...customQuestions);
    }

    // Build the assistant prompt with job context if provided
    let assistantPrompt = `You are conducting a professional reference check interview.

Candidate Information:
- Name: ${refCheck.candidate_name || 'the candidate'}
- Position Applied For: ${refCheck.position_title || 'Not specified'}
`;

    // Add job description context if provided
    if (jobDescription && jobDescription.trim()) {
      assistantPrompt += `
Job Description:
${jobDescription.trim()}

Please use this job description as context when asking questions and evaluating the candidate's fit for this specific role.
`;
    }

    assistantPrompt += `
Reference Questions:
Please ask the following questions in a natural, conversational manner:

${allQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

Interview Guidelines:
- Start by confirming you're speaking with ${refereeName || 'the reference'}
- Be professional, warm, and conversational
- Listen carefully to each response
- Ask natural follow-up questions to get detailed, specific examples
- If the job description was provided, use it to ask targeted follow-up questions about relevant skills and experience
- Take note of specific examples, achievements, and concerns
- Keep the total call duration under 20 minutes
- Thank them sincerely at the end for their time

Important: Focus on getting concrete examples and specific details rather than general statements.
`;

    // Create assistant in Vapi
    const assistantResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Reference Check - ${refCheck.candidate_name || 'Candidate'} - ${new Date().toISOString().split('T')[0]}`,
        model: {
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
        },
        voice: {
          provider: 'elevenlabs',
          voiceId: 'rachel', // Professional female voice
        },
        firstMessage: `Hi, this is the VoiceRef automated reference checking system. I'm calling to conduct a reference check for ${refCheck.candidate_name || 'a candidate who has applied for a position'}. Am I speaking with ${refereeName || 'the right person'}?`,
        systemPrompt: assistantPrompt,
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error('Vapi assistant creation failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to create AI assistant' },
        { status: 500 }
      );
    }

    const assistant = await assistantResponse.json();

    // Save phone check to database with all the context
    const { data: phoneCheck, error: dbError } = await supabase
      .from('phone_reference_checks')
      .insert({
        reference_check_id: referenceCheckId,
        phone_number: phoneNumber,
        scheduled_time: scheduledTime,
        vapi_assistant_id: assistant.id,
        status: 'scheduled',
        referee_name: refereeName,
        referee_email: refereeEmail,
        metadata: {
          standard_questions: STANDARD_QUESTIONS,
          custom_questions: customQuestions || [],
          job_description: jobDescription || null,
          candidate_name: refCheck.candidate_name,
          position_title: refCheck.position_title,
          total_questions: allQuestions.length
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save phone check to database' },
        { status: 500 }
      );
    }

    // Update reference check status
    try {
      await supabase
        .from('reference_checks')
        .update({
          status: 'phone_scheduled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', referenceCheckId);
    } catch (err) {
      console.log('Could not update reference_checks status (column may not exist)');
    }

    return NextResponse.json({
      success: true,
      phoneCheckId: phoneCheck.id,
      assistantId: assistant.id,
      scheduledTime: scheduledTime,
      questionsCount: {
        standard: STANDARD_QUESTIONS.length,
        custom: customQuestions?.length || 0,
        total: allQuestions.length
      },
      message: 'Phone reference check scheduled successfully',
    });

  } catch (error: any) {
    console.error('Error scheduling phone check:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
