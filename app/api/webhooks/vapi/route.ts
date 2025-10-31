import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received Vapi webhook:', JSON.stringify(body, null, 2));

    const { message, call } = body;

    if (!call || !call.id) {
      console.log('No call ID in webhook, skipping');
      return NextResponse.json({ received: true });
    }

    // Find the phone check by Vapi call ID
    const { data: phoneCheck, error: findError } = await supabase
      .from('phone_reference_checks')
      .select('*')
      .eq('vapi_call_id', call.id)
      .single();

    if (findError || !phoneCheck) {
      console.log('Phone check not found for call ID:', call.id);
      return NextResponse.json({ received: true });
    }

    // Handle different message types
    switch (message?.type) {
      case 'call-started':
        await supabase
          .from('phone_reference_checks')
          .update({
            status: 'in_progress',
            actual_call_time: new Date().toISOString(),
          })
          .eq('id', phoneCheck.id);
        break;

      case 'call-ended':
      case 'end-of-call-report':
        // Extract transcript from the call
        const transcript = call.transcript || call.messages
          ?.map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n') || '';

        const duration = call.duration || call.endedAt && call.startedAt 
          ? (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
          : null;

        // Determine final status
        let finalStatus = 'completed';
        if (call.status === 'no-answer' || call.endedReason === 'customer-did-not-answer') {
          finalStatus = 'no_answer';
        } else if (call.status === 'failed' || call.endedReason === 'assistant-error') {
          finalStatus = 'failed';
        }

        // Update the phone check with results
        const { error: updateError } = await supabase
          .from('phone_reference_checks')
          .update({
            status: finalStatus,
            transcript: transcript,
            recording_url: call.recordingUrl || null,
            duration_seconds: duration,
            metadata: call,
          })
          .eq('id', phoneCheck.id);

        if (updateError) {
          console.error('Error updating phone check:', updateError);
        }

        // Also update the main reference check status
        if (finalStatus === 'completed') {
          await supabase
            .from('reference_checks')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', phoneCheck.reference_check_id);

          // Extract answers from transcript and save to reference_answers table
          await extractAndSaveAnswers(phoneCheck.reference_check_id, transcript);
        }
        break;

      case 'transcript':
        // Update transcript in real-time as it comes in
        if (body.transcript) {
          await supabase
            .from('phone_reference_checks')
            .update({
              transcript: body.transcript,
            })
            .eq('id', phoneCheck.id);
        }
        break;

      default:
        console.log('Unhandled message type:', message?.type);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function extractAndSaveAnswers(referenceCheckId: string, transcript: string) {
  try {
    // Get the questions for this reference check
    const { data: questions, error: questionsError } = await supabase
      .from('reference_questions')
      .select('*')
      .eq('reference_check_id', referenceCheckId)
      .order('order');

    if (questionsError || !questions) {
      console.error('Error fetching questions:', questionsError);
      return;
    }

    // Use AI to extract answers from transcript
    // For now, save the full transcript as a single answer
    // You can enhance this with GPT to parse specific answers
    
    for (const question of questions) {
      // Simple approach: save transcript for each question
      // Better approach: use GPT to extract specific answers
      await supabase
        .from('reference_answers')
        .insert({
          reference_check_id: referenceCheckId,
          question_id: question.id,
          answer: `[From phone transcript]\n${transcript}`,
          source: 'phone',
        });
    }

  } catch (error) {
    console.error('Error extracting answers:', error);
  }
}

// Allow GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}
