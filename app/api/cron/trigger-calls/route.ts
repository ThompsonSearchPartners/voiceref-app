import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  // Verify cron secret - check both header AND query param
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get('secret');
  
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = authHeader?.replace('Bearer ', '') || secretParam;
  
  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    console.log('Checking for scheduled calls at:', now.toISOString());

    // Get all scheduled calls that should happen now (scheduled_time <= now)
    const { data: scheduledCalls, error: fetchError } = await supabase
      .from('scheduled_calls')
      .select('*')
      .eq('call_status', 'scheduled')
      .eq('call_completed', false)
      .lte('scheduled_time', now.toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled calls:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled calls', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!scheduledCalls || scheduledCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls to process',
        processed: 0,
      });
    }

    console.log(`Found ${scheduledCalls.length} calls to process:`, scheduledCalls);

    const results = await Promise.allSettled(
      scheduledCalls.map(async (call) => {
        try {
          console.log(`Processing call ${call.id} for ${call.reference_name}`);

          // Create the Vapi call
          const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assistantId: call.vapi_assistant_id,
              phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
              customer: {
                number: call.reference_phone,
                name: call.reference_name,
              },
            }),
          });

          if (!vapiResponse.ok) {
            const errorText = await vapiResponse.text();
            console.error('Vapi API error:', errorText);
            throw new Error(`Vapi API error: ${errorText}`);
          }

          const vapiCall = await vapiResponse.json();
          console.log('Vapi call created:', vapiCall);

          // Update the record with call info
          const { error: updateError } = await supabase
            .from('scheduled_calls')
            .update({
              call_status: 'in_progress',
              vapi_call_id: vapiCall.id,
            })
            .eq('id', call.id);

          if (updateError) {
            console.error('Error updating call status:', updateError);
          }

          return { success: true, callId: call.id, vapiCallId: vapiCall.id };

        } catch (error: any) {
          console.error(`Error initiating call ${call.id}:`, error);
          
          // Update status to failed
          await supabase
            .from('scheduled_calls')
            .update({
              call_status: 'failed',
            })
            .eq('id', call.id);

          return { success: false, callId: call.id, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`Processed: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${scheduledCalls.length} scheduled calls`,
      successful,
      failed,
      details: results,
    });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
