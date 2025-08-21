interface CustomQuestion {
  text: string
  category: string
  order_num: number
}

export async function generateCustomQuestions(
  jobDescription: string,
  position: string
): Promise<CustomQuestion[]> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          { 
            role: "user", 
            content: `Generate 8 tailored reference check questions for this position. Make them specific to the role requirements and responsibilities.

Position: ${position}

Job Description:
${jobDescription}

Requirements:
1. Create 8 questions that dig into the specific skills and experiences needed for this role
2. Include both technical and soft skill questions relevant to the position
3. Make questions conversational and natural for a phone interview
4. Focus on examples and specific scenarios when possible

Return ONLY a JSON array with this exact format:
[
  {
    "text": "Question text here",
    "category": "intro|technical|leadership|collaboration|problem_solving|performance|growth|recommendation",
    "order_num": 1
  }
]

DO NOT include any other text, just the JSON array.`
          }
        ]
      })
    });

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean up the response to extract JSON
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const questions = JSON.parse(responseText);
    
    // Validate the structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }

    return questions;
  } catch (error) {
    console.error('Question generation error:', error);
    
    // Fallback to default questions if AI generation fails
    return [
      { text: "Can you confirm your name and relationship to the candidate?", category: "intro", order_num: 1 },
      { text: "How long did you work with the candidate and in what capacity?", category: "intro", order_num: 2 },
      { text: `What specific skills and experiences made the candidate effective in their ${position.toLowerCase()} role?`, category: "technical", order_num: 3 },
      { text: "Can you describe how the candidate approached challenging problems or projects?", category: "problem_solving", order_num: 4 },
      { text: "How would you describe the candidate's collaboration and communication style?", category: "collaboration", order_num: 5 },
      { text: "What was the candidate's biggest strength in their role?", category: "performance", order_num: 6 },
      { text: "Are there any areas where you think the candidate could continue to grow?", category: "growth", order_num: 7 },
      { text: "Would you hire this candidate again, and would you recommend them for this type of role?", category: "recommendation", order_num: 8 }
    ];
  }
}
