import axios from 'axios';

export async function callAI(messages: any[], opts: any = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (!apiKey) {
    // Fallback to Gemini if OpenRouter is not set
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'openai/gpt-3.5-turbo', // Using a cheaper model by default for demo
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1500,
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': appUrl,
      'X-Title': 'AstroAudition',
      'Content-Type': 'application/json'
    }
  });

  return res.data.choices[0].message.content;
}
