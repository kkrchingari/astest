import api from './api';

export async function translateContent(text: string, targetLanguage: string) {
  if (!text || targetLanguage.toLowerCase() === 'english') return text;

  try {
    const { data } = await api.post('/ai/translate', { 
      text, 
      targetLanguage 
    });
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function translateMcqQuestion(question: any, targetLanguage: string) {
  if (!question || targetLanguage.toLowerCase() === 'english') return question;

  try {
    const { data } = await api.post('/ai/translate', { 
      isMcq: true,
      question,
      targetLanguage 
    });
    return data;
  } catch (error) {
    console.error('MCQ Translation error:', error);
    return question;
  }
}
