import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'
import { sendReferenceInvitation } from '../../../lib/resend'
import { generateCustomQuestions } from '../../../lib/ai-questions'


export async function POST(request: NextRequest) {
  try {
    const { candidate, references } = await request.json()

    // Create reference check record
    const { data: checkData, error: checkError } = await supabase
      .from('reference_checks')
      .insert({
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        position: candidate.position,
        job_description: candidate.jobDescription,
        status: 'generating_questions'
      })
      .select()
      .single()

    if (checkError) {
      throw checkError
    }

    // Generate custom questions based on job description
    try {
      const customQuestions = await generateCustomQuestions(
        candidate.jobDescription,
        candidate.position
      )

      // Save custom questions to database
      const questionInserts = customQuestions.map(q => ({
        check_id: checkData.id,
        text: q.text,
        category: q.category,
        order_num: q.order_num
      }))

      const { error: questionsError } = await supabase
        .from('custom_questions')
        .insert(questionInserts)

      if (questionsError) {
        console.error('Questions save error:', questionsError)
      }
    } catch (error) {
      console.error('Question generation error:', error)
      // Continue with default questions if custom generation fails
    }

    // Update status to pending after questions are generated
    await supabase
      .from('reference_checks')
      .update({ status: 'pending' })
      .eq('id', checkData.id)

    // Create reference records and send invitations
    for (const ref of references) {
      if (ref.name && ref.email) {
        // Create reference record
        const { data: refData, error: refError } = await supabase
          .from('reference_contacts')
          .insert({
            check_id: checkData.id,
            name: ref.name,
            email: ref.email,
            phone: ref.phone,
            relationship: ref.relationship,
            company: ref.company,
            status: 'invitation_sent'
          })
          .select()
          .single()

        if (refError) {
          console.error('Reference creation error:', refError)
          continue
        }

        // Send invitation email
        const interviewLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reference/${refData.id}`
        await sendReferenceInvitation(
          ref.name,
          ref.email,
          candidate.name,
          interviewLink
        )
      }
    }

    return NextResponse.json({ success: true, checkId: checkData.id })
  } catch (error) {
    console.error('Reference check creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create reference check' },
      { status: 500 }
    )
  }
}
