export async function scheduleVapiCall(
  phoneNumber: string,
  questions: string[],
  candidateName: string,
  position: string
) {
  try {
    const systemPrompt = `You are conducting a professional reference
