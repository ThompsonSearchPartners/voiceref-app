import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate, reference } = body;

    // Validate required fields
    if (!candidate || !reference || !reference.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reference check
    const { data: checkData, error: checkError } = await supabase
      .from('reference_checks')
      .insert({
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        position: candidate.position,
        job_description: candidate.jobDescription,
        hiring_manager: candidate.hiringManager,
        company: candidate.company,
        status: 'pending',
      })
      .select()
      .single();

    if (checkError) {
      console.error('Error creating reference check:', checkError);
      return NextResponse.json(
        { error: 'Failed to create reference check' },
        { status: 500 }
      );
    }

    // Create reference record
    const { data: refData, error: refError } = await supabase
      .from('references')
      .insert({
        check_id: checkData.id,
        name: reference.name,
        email: reference.email,
        phone: reference.phone,
        relationship: reference.relationship,
        company: reference.company,
        status: 'pending',
      })
      .select()
      .single();

    if (refError) {
      console.error('Error creating reference:', refError);
      return NextResponse.json(
        { error: 'Failed to create reference' },
        { status: 500 }
      );
    }

    // Insert default questions (since we skipped OpenAI)
    await insertDefaultQuestions(checkData.id, candidate.position);

    // Send email to reference
    await sendReferenceEmail({
      referenceName: reference.name,
      referenceEmail: reference.email,
      candidateName: candidate.name,
      position: candidate.position,
      company: candidate.company,
      referenceId: refData.id,
    });

    return NextResponse.json({
      success: true,
      referenceCheckId: checkData.id,
      referenceId: refData.id,
      message: 'Reference check created and email sent',
    });
  } catch (error) {
    console.error('Error in create-reference-check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function insertDefaultQuestions(checkId: string, position: string) {
  const defaultQuestions = [
    'Can you describe your working relationship with the candidate?',
    `What were the candidate's primary responsibilities in the ${position} role?`,
    'What would you say are their greatest strengths?',
    'What areas do you think they could improve?',
    'How would you rate their communication skills?',
    'How did they handle challenging situations or pressure?',
    'Would you rehire this person if given the opportunity?',
    'Is there anything else you think we should know about the candidate?',
  ];

  const questionRecords = defaultQuestions.map((text, index) => ({
    check_id: checkId,
    text,
    category: 'standard',
    order_num: index + 1,
  }));

  await supabase.from('questions').insert(questionRecords);
}

async function sendReferenceEmail({
  referenceName,
  referenceEmail,
  candidateName,
  position,
  company,
  referenceId,
}: {
  referenceName: string;
  referenceEmail: string;
  candidateName: string;
  position: string;
  company: string;
  referenceId: string;
}) {
  const schedulingLink = `${process.env.NEXT_PUBLIC_APP_URL}/reference/${referenceId}/schedule`;

  // Email content
  const emailSubject = `Reference Check Request for ${candidateName}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reference Check Request</h2>
      
      <p>Hi ${referenceName},</p>
      
      <p>${company} has requested a reference check for <strong>${candidateName}</strong> who has applied for the position of <strong>${position}</strong>.</p>
      
      <p>We'd like to conduct a brief phone interview with you. The entire process is simple:</p>
      
      <ol>
        <li>Click the link below to choose a convenient time</li>
        <li>Our AI interviewer will call you at your chosen time</li>
        <li>The interview takes 10-15 minutes</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${schedulingLink}" 
           style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          Schedule Your Phone Interview
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This link will remain active for 14 days. The phone interview is completely automated and your responses are confidential.
      </p>
      
      <p>Thank you for your time,<br>
      VoiceRef Team</p>
    </div>
  `;

  // Send via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VoiceRef <noreply@voiceref.com>',
        to: referenceEmail,
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      console.error('Email send error:', await response.text());
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
