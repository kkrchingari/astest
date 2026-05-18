export async function callAI(messages: any[], opts: any = {}) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://astrolive.ai", // Optional, for OpenRouter rankings
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

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      let errorData = {};
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { raw: text };
      }
      throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('OpenRouter returned an empty response');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse OpenRouter JSON:', responseText);
      throw new Error('Invalid JSON response from OpenRouter');
    }

    let text = data.choices?.[0]?.message?.content || '';

    if (opts.json) {
      // Sometimes models wrap in markdown even when asked for JSON format
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    return text;
  } catch (error: any) {
    console.error('OpenRouter AI Error:', error);
    throw error;
  }
}
