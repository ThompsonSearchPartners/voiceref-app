import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendReferenceInvitation(
  referenceName: string,
  referenceEmail: string,
  candidateName: string,
  interviewLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'VoiceRef <noreply@voiceref.com>',
      to: [referenceEmail],
      subject: `Reference Check Request for ${candidateName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reference Check Request</h2>
          <p>Dear ${referenceName},</p>
          <p>You've been selected as a reference for <strong>${candidateName}</strong> for a position they're being considered for.</p>
          <p>We'd like you to complete a brief 10-minute online interview to gather your insights about their work experience and capabilities.</p>
          <p>The interview features custom questions tailored to the specific role and can be completed at your convenience using voice or text responses.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${interviewLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Complete Reference Interview
            </a>
          </div>
          <p><strong>What to expect:</strong></p>
          <ul>
            <li>10-minute online interview</li>
            <li>Questions tailored to the specific role</li>
            <li>Complete at your convenience on any device</li>
            <li>Voice or text responses - your choice</li>
          </ul>
          <p>The process is completely confidential and your responses will only be shared with the hiring team.</p>
          <p>Thank you for your time and assistance.</p>
          <p>Best regards,<br>The VoiceRef Team</p>
        </div>
      `
    })

    if (error) {
      throw error
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
