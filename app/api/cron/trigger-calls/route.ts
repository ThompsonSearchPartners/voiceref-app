import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VAPI_API_KEY = '22fe7d9a-288d-4946-a020-6aa8581bb251';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here'; // Set this in your env vars

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // Get all scheduled calls that should happen in the next 5 minutes
    const { data: scheduledCalls, error: fetchError } = await supabase
      .from('phone_reference_checks')
      .select('*')
      .eq('status', 'scheduled')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', fiveMinutesFromNow.toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled calls:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled calls' },
        { status: 500 }
      );
    }

    if (!scheduledCalls || scheduledCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No calls scheduled for the next 5 minutes',
        processed: 0,
      });
    }

    console.log(`Found ${scheduledCalls.length} calls to process`);

    const results = await Promise.allSettled(
      scheduledCalls.map(async (call) => {
        try {
          // Initiate the call via Vapi
          const response = await fetch(`https://api.vapi.ai/call/${call.vapi_call_id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              assistantId: call.vapi_assistant_id,
              phoneNumberId: '88a8d0a5-f407-4198-a1ab-8b9c5fd1a7b7',
              customer: {
                number: call.phone_number,
                name: call.referee_name,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vapi API error: ${errorText}`);
          }

          // Update status to in_progress
          await supabase
            .from('phone_reference_checks')
            .update({
              status: 'in_progress',
              actual_call_time: now.toISOString(),
            })
            .eq('id', call.id);

          return { success: true, callId: call.id };
        } catch (error: any) {
          console.error(`Error initiating call ${call.id}:`, error);
          
          // Update status to failed
          await supabase
            .from('phone_reference_checks')
            .update({
              status: 'failed',
              error_message: error.message,
            })
            .eq('id', call.id);

          return { success: false, callId: call.id, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

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

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
