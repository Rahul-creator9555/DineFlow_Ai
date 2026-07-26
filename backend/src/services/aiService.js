import { groq } from '../config/groq.js';
import { File } from 'buffer';

/**
 * 💬 TEXT ORDER PARSER (Groq + Llama 3.3 70B JSON Mode)
 */
export async function parseTextOrder(userText, availableMenu) {
  const menuSummary = availableMenu.map(m => ({ 
    menuItemId: m._id.toString(), 
    name: m.name, 
    price: m.price 
  }));

  const systemPrompt = `You are DineFlow AI, a restaurant ordering engine.
Match the user request to this menu:
${JSON.stringify(menuSummary)}

Output ONLY valid JSON matching this schema:
{
  "items": [
    {
      "menuItemId": "exact MongoDB menuItemId string",
      "name": "dish name",
      "quantity": 1,
      "customization": "e.g. less spicy, no onions"
    }
  ],
  "waiterNote": "optional non-food request"
}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * 🎙️ VOICE ORDER PARSER (Groq Whisper -> Groq Llama)
 */
export async function parseAudioOrder(audioBuffer, mimeType, availableMenu) {
  // 1. Transcribe audio buffer using Groq Whisper
  const audioFile = new File([audioBuffer], 'voice_note.ogg', { type: mimeType || 'audio/ogg' });

  const transcription = await groq.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-large-v3-turbo',
    language: 'hi', // Supports Hindi, Hinglish, English seamlessly
    response_format: 'text'
  });

  console.log('🎙️ Whisper Transcription:', transcription);

  // 2. Parse transcribed text through Llama 3.3
  return await parseTextOrder(transcription, availableMenu);
}