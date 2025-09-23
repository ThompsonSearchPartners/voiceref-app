export async function scheduleVapiCall(
  phoneNumber: string,
  questions: string[],
  candidateName: string,
  position: string
) {
  try {
    const systemPrompt = `You are conducting a professional reference check for ${candidateName} who is being considered for a ${position} position.

Your task:
1. Introduce yourself professionally as an automated reference checking system
2. Confirm you're speaking with the correct reference
3. Ask each of the following questions, one at a time
4. Allow the reference to answer fully before moving to the next question
5. Be conversational and professional
6. Thank them at the end

Questions to ask:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Remember: Be warm, professional, and give them time to think and respond.`

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        assistantOverrides: {
          serverUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/vapi-webhook`
        },
        assistant: {
          model: {
            provider: 'openai',
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              }
            ]
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: '21m00Tcm4TlvDq8ikWAM'
          }
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to schedule call')
    }

    return {
      success: true,
      callId: data.id
    }
  } catch (error) {
    console.error('Vapi.ai error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
