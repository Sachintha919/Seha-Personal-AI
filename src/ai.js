import { GoogleGenAI } from '@google/genai';
import { PERSONA } from '../config/persona.js';
import { config } from './config.js';
import { profilePrompt } from './profile.js';

let geminiClient;

function languageInstruction(language) {
  if (language === 'sinhala') return 'Reply only in natural, conversational Sinhala.';
  if (language === 'english') return 'Reply only in natural, conversational English.';
  return 'Reply in the same language as the latest user message.';
}

function systemInstruction({ ownerName, language, profile }) {
  return `${PERSONA.replaceAll('{{OWNER_NAME}}', ownerName || 'Owner')}\n\n${languageInstruction(language)}\n${profilePrompt(profile)}\n\nOutput style: brief, warm, natural WhatsApp chat. Usually 1-4 short sentences. No headings unless asked.`;
}

async function askGemini(prompt) {
  geminiClient ||= new GoogleGenAI({ apiKey: config.geminiApiKey });
  const result = await geminiClient.models.generateContent({
    model: config.geminiModel,
    contents: prompt.userMessage,
    config: {
      systemInstruction: prompt.system,
      temperature: 0.85,
      maxOutputTokens: 220,
      candidateCount: 1
    }
  });
  const answer = String(result.text || '').trim();
  if (!answer) throw new Error('Gemini returned an empty response.');
  return answer;
}

async function askGroq(prompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.groqModel,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.userMessage }
      ],
      temperature: 0.85,
      max_completion_tokens: 220,
      reasoning_effort: 'low'
    })
  });
  if (!response.ok) throw new Error(`Groq API error (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const answer = String(data.choices?.[0]?.message?.content || '').trim();
  if (!answer) throw new Error('Groq returned an empty response.');
  return answer;
}

export async function generateReply({ message, profile, settings, ownerName }) {
  const prompt = {
    system: systemInstruction({ ownerName, language: settings.language || 'auto', profile }),
    userMessage: String(message).slice(0, 5000)
  };

  if (config.geminiApiKey) {
    try {
      return await askGemini(prompt);
    } catch (error) {
      console.warn(`[AI] Gemini failed: ${error.message}`);
      if (!config.groqApiKey) throw error;
      console.warn('[AI] Trying Groq fallback...');
    }
  }
  if (config.groqApiKey) return askGroq(prompt);
  throw new Error('No AI API key is configured.');
}
