import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get reference details
    const { data: reference, error: refError } = await supabase
      .from('reference_contacts')
      .select(`
        *,
        reference_checks (candidate_name, position, id)
      `)
      .eq('id', params.id)
      .single()

    if (refError) {
      throw refError
    }

    // Get custom questions for this reference check
    const { data: questions, error: questionsError } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('check_id', reference.reference_checks.id)
      .order('order_num', { ascending: true })

    if (questionsError) {
      console.error('Questions error:', questionsError)
      // If no custom questions, use default ones
      const { data: defaultQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('active', true)
        .order('order_num', { ascending: true })
      
      return NextResponse.json({
        reference,
        questions: defaultQuestions || []
      })
    }

    return NextResponse.json({
      reference,
      questions: questions || []
    })
  } catch (error) {
    console.error('Reference lookup error:', error)
    return NextResponse.json(
      { error: 'Reference not found' },
      { status: 404 }
    )
  }
}
