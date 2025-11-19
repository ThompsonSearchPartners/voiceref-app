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
      referenceId,
      phoneNumber,
      scheduledTime,
      customQuestions = [],
    } = body;

    // Get reference data
    const { data: reference, error: refError } = await supabase
      .from('references')
      .select(`
        *,
        reference_checks!check_id (
          id,
          candidate_name,
          position,
          company,
          job_description
        )
      `)
      .eq('id', referenceId)
      .single();

    if (refError || !reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      );
    }

    // Get questions for this reference check
    const { data: dbQuestions } = await supabase
      .from('questions')
      .select('text')
      .eq('check_id', reference.check_id)
      .order('order_num');

    // Combine database questions with any custom questions
    const allQuestions = [
      ...(dbQuestions || []).map(q => q.text),
      ...customQuestions.filter((q: string) => q.trim() !== '')
    ];

    // Call the existing working API
    const scheduleResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/phone-reference/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceCheckId: reference.check_id,
        referenceName: reference.name,
        referencePhone: phoneNumber,
        referenceEmail: reference.email || null,
        scheduledTime: scheduledTime,
        questions: allQuestions,
        candidateName: reference.reference_checks?.candidate_name || 'the candidate',
      }),
    });

    if (!scheduleResponse.ok) {
      const errorData = await scheduleResponse.json();
      throw new Error(errorData.error || 'Failed to schedule call');
    }

    const scheduleData = await scheduleResponse.json();

    // Update reference status
    await supabase
      .from('references')
      .update({ status: 'scheduled' })
      .eq('id', referenceId);

    return NextResponse.json({
      success: true,
      message: 'Phone call scheduled successfully',
      ...scheduleData,
    });
  } catch (error) {
    console.error('Error scheduling phone check:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
