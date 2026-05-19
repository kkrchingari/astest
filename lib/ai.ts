import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callAI(messages: any[], opts: any = {}) {
  // First try OpenRouter
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY missing');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astrolive.ai",
        "X-Title": "Astrolive Vetting"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free", 
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        temperature: opts.temperature ?? 0.1,
        response_format: opts.json ? { type: "json_object" } : undefined
      })
    });

    if (response.ok) {
      const responseText = await response.text();
      if (responseText) {
        let data = JSON.parse(responseText);
        let text = data.choices?.[0]?.message?.content || '';
        if (opts.json) {
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        return text;
      }
    }
    
    console.warn('OpenRouter failed, falling back to Gemini...');
  } catch (error: any) {
    console.error('OpenRouter Error, trying Gemini fallback:', error.message);
  }

  // Fallback to Gemini
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required for fallback');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemMessage?.content
    });

    const chat = model.startChat({
      history: userMessages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
    });

    const lastMessage = userMessages[userMessages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    let text = responseText;
    if (opts.json) {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    return text;
  } catch (error: any) {
    console.error('Gemini Fallback Error:', error);
    throw new Error('Both OpenRouter and Gemini failed. Please check your API keys.');
  }
}
