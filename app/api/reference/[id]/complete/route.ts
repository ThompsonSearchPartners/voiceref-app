import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { responses } = await request.json()

    // Get reference and questions
    const { data: reference } = await supabase
      .from('reference_contacts')
      .select(`
        *,
        reference_checks (id)
      `)
      .eq('id', params.id)
      .single()

    if (!reference) {
      throw new Error('Reference not found')
    }

    const { data: questions } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('check_id', reference.reference_checks.id)
      .order('order_num', { ascending: true })

    // Save responses
    const responseInserts = responses.map((response: string, index: number) => ({
      reference_id: params.id,
      question_id: questions?.[index]?.id,
      transcript: response,
      sentiment_score: Math.random() * 0.4 + 0.6, // Mock sentiment for now
      sentiment_label: Math.random() > 0.3 ? 'positive' : 'neutral'
    }))

    const { error: responsesError } = await supabase
      .from('responses')
      .insert(responseInserts)

    if (responsesError) {
      throw responsesError
    }

    // Update reference status
    await supabase
      .from('reference_contacts')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', params.id)

    // Check if all references for this check are completed
    const { data: allReferences } = await supabase
      .from('reference_contacts')
      .select('status')
      .eq('check_id', reference.reference_checks.id)

    const allCompleted = allReferences?.every(ref => ref.status === 'completed')

    if (allCompleted) {
      // Generate analysis report
      await generateAnalysisReport(reference.reference_checks.id)
      
      // Update check status
      await supabase
        .from('reference_checks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', reference.reference_checks.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Interview completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete interview' },
      { status: 500 }
    )
  }
}

async function generateAnalysisReport(checkId: string) {
  // This would use AI to analyze all responses and generate insights
  // For now, we'll create a mock report
  const { error } = await supabase
    .from('analysis_reports')
    .insert({
      check_id: checkId,
      overall_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
      sentiment_summary: 'Overall positive feedback with strong recommendations',
      key_insights: [
        'Strong technical skills mentioned consistently',
        'Excellent teamwork and collaboration',
        'Proven track record of delivering results',
        'Positive attitude and work ethic highlighted'
      ],
      red_flags: Math.random() > 0.8 ? ['Minor communication concerns mentioned'] : [],
      recommendation: 'Strong hire recommendation based on reference feedback'
    })

  if (error) {
    console.error('Analysis report error:', error)
  }
}
