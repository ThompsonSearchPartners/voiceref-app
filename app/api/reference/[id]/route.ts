import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const referenceId = params.id;

    // Get reference with related reference check and questions
    const { data: reference, error } = await supabase
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

    if (error || !reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      );
    }

    // Check if reference is still active
    if (reference.status === 'completed') {
      return NextResponse.json(
        { error: 'This reference check has already been completed' },
        { status: 410 }
      );
    }

    // Get questions for this reference check
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('check_id', reference.check_id)
      .order('order_num');

    return NextResponse.json({
      reference: {
        ...reference,
        reference_checks: {
          candidate_name: reference.reference_checks?.candidate_name,
          position: reference.reference_checks?.position,
          company: reference.reference_checks?.company,
        },
      },
      questions: questions || [],
    });
  } catch (error) {
    console.error('Error fetching reference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
