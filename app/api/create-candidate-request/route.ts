import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidate, hrEmail } = body;

    // Validate required fields
    if (!candidate || !candidate.name || !candidate.email || !candidate.position || !candidate.jobDescription || !candidate.company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reference check record
    const { data: checkData, error: checkError } = await supabase
      .from('reference_checks')
      .insert({
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        position: candidate.position,
        job_description: candidate.jobDescription,
        hiring_manager: hrEmail,
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

    // Insert default questions for this reference check
    await insertDefaultQuestions(checkData.id, candidate.position);

    // Send email to candidate
    await sendCandidateEmail({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      position: candidate.position,
      company: candidate.company,
      referenceCheckId: checkData.id,
    });

    return NextResponse.json({
      success: true,
      referenceCheckId: checkData.id,
      message: 'Reference check created and email sent to candidate',
    });
  } catch (error) {
    console.error('Error in create-candidate-request:', error);
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

async function sendCandidateEmail({
  candidateName,
  candidateEmail,
  position,
  company,
  referenceCheckId,
}: {
  candidateName: string;
  candidateEmail: string;
  position: string;
  company: string;
  referenceCheckId: string;
}) {
  const addReferencesLink = `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${referenceCheckId}/add-references`;

  const emailSubject = `Reference Check for ${position} at ${company}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reference Check Request</h2>
      
      <p>Hi ${candidateName},</p>
      
      <p>${company} has requested reference checks for your application for the <strong>${position}</strong> position.</p>
      
      <p>To complete this step, please add your professional references:</p>
      
      <ol>
        <li>Click the link below to access the secure portal</li>
        <li>Add 2-5 references (names, emails, phone numbers, relationships)</li>
        <li>We'll automatically email each reference to schedule their phone interview</li>
      </ol>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${addReferencesLink}" 
           style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          Add Your References
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This link will remain active for 14 days. Your references will receive automated phone calls at times they choose.
      </p>
      
      <p>Thank you,<br>
      ${company} Team</p>
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
        from: 'VoiceRef <onboarding@resend.dev>',
        to: candidateEmail,
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email send error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    console.log('Email sent successfully to:', candidateEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
