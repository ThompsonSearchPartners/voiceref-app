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
      from: 'VoiceRef <onboarding@resend.dev>',
      to: [referenceEmail],
      subject: `Reference Check Request for ${candidateName}`,
      html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Reference Check Request</h2>
    <p>Dear ${referenceName},</p>
    <p>You've been selected as a reference for <strong>${candidateName}</strong> for a position they're being considered for.</p>
    <p>We'd like you to complete a brief 10-minute reference check to gather your insights about their work experience and capabilities.</p>
    
    <p>Please choose your preferred method:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${interviewLink}" style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px;">
        Complete Online Now
      </a>
      <br>
      <a href="${interviewLink}/schedule" style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px;">
        Schedule Phone Call
      </a>
    </div>
    
    <p><strong>Online option:</strong> Complete immediately using voice or text responses (10 min)</p>
    <p><strong>Phone option:</strong> We'll call you at your preferred time for a brief conversation (5 min)</p>
    
    <p>The reference check features custom questions tailored to the specific role and your responses are completely confidential.</p>
    
    <p>Thank you for your time and assistance.</p>
    <p>Best regards,<br>The VoiceRef Team</p>
  </div>
`
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
