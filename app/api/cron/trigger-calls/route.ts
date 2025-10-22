import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find calls scheduled for the next 10 minutes
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: scheduledCalls, error: fetchError } = await supabase
      .from('phone_reference_checks')
      .select('*')
      .eq('call_status', 'scheduled')
      .gte('scheduled_time', now)
      .lte('scheduled_time', tenMinutesFromNow)
      .is('vapi_call_id', null);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledCalls?.length || 0} calls to trigger`);

    // Trigger each call via Vapi
    const results = [];
    for (const call of scheduledCalls || []) {
      try {
        const response = await fetch('https://api.vapi.ai/call/phone', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            assistantId: call.vapi_assistant_id,
            customer: { 
              number: call.reference_phone, 
              name: call.reference_name 
            },
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID
          })
        });

        if (response.ok) {
          const callData = await response.json();
          
          // Update with call ID and status
          await supabase
            .from('phone_reference_checks')
            .update({ 
              vapi_call_id: callData.id, 
              call_status: 'in_progress' 
            })
            .eq('id', call.id);

          results.push({ id: call.id, status: 'triggered', callId: callData.id });
          console.log(`Triggered call ${call.id}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to trigger call ${call.id}:`, errorText);
          results.push({ id: call.id, status: 'failed', error: errorText });
        }
      } catch (error) {
        console.error(`Error triggering call ${call.id}:`, error);
        results.push({ id: call.id, status: 'error', error: String(error) });
      }
    }

    return NextResponse.json({ 
      success: true, 
      triggered: results.length,
      results 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger calls',
      details: String(error)
    }, { status: 500 });
  }
}
