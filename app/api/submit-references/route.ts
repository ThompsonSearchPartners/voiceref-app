import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceCheckId, references } = body;

    // Validate
    if (!referenceCheckId || !references || references.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 references are required' },
        { status: 400 }
      );
    }

    // Get reference check data
    const { data: checkData, error: checkError } = await supabase
      .from('reference_checks')
      .select('*')
      .eq('id', referenceCheckId)
      .single();

    if (checkError || !checkData) {
      return NextResponse.json(
        { error: 'Reference check not found' },
        { status: 404 }
      );
    }

    // Get questions for this check
    const { data: questions } = await supabase
      .from('questions')
      .select('text')
      .eq('check_id', referenceCheckId)
      .order('order_num');

    // Create reference records and send emails
    for (const ref of references) {
      // Create reference record
      const { data: refData, error: refError } = await supabase
        .from('references')
        .insert({
          check_id: referenceCheckId,
          name: ref.name,
          email: ref.email,
          phone: ref.phone,
          relationship: ref.relationship,
          company: ref.company || null,
          status: 'pending',
        })
        .select()
        .single();

      if (refError) {
        console.error('Error creating reference:', refError);
        continue; // Skip this one but continue with others
      }

      // Send email to this reference
      await sendReferenceEmail({
        referenceName: ref.name,
        referenceEmail: ref.email,
        candidateName: checkData.candidate_name,
        position: checkData.position,
        company: checkData.company,
        referenceId: refData.id,
      });
    }

    // Update reference check status
    await supabase
      .from('reference_checks')
      .update({ status: 'references_submitted' })
      .eq('id', referenceCheckId);

    return NextResponse.json({
      success: true,
      message: 'References submitted and emails sent',
    });
  } catch (error) {
    console.error('Error submitting references:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
        from: 'VoiceRef <onboarding@resend.dev>',
        to: referenceEmail,
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email send error:', errorText);
    } else {
      console.log('Email sent successfully to:', referenceEmail);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
