import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const referenceCheckId = params.id;

    // Get reference check data
    const { data: checkData, error } = await supabase
      .from('reference_checks')
      .select('*')
      .eq('id', referenceCheckId)
      .single();

    if (error || !checkData) {
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      );
    }

    // Check if already completed or expired
    if (checkData.status === 'completed') {
      return NextResponse.json(
        { error: 'This reference check has already been completed' },
        { status: 410 }
      );
    }

    return NextResponse.json(checkData);
  } catch (error) {
    console.error('Error fetching reference check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

