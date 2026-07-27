import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

// Word to number dictionary for fallback
const wordToNum = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

// 💬 Text Order & Reservation Parser via Groq AI
export async function parseTextOrder(userText, menuItems) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️ GROQ_API_KEY missing. Falling back to Regex parsing.');
      return fallbackRegexParse(userText, menuItems);
    }

    const menuListStr = menuItems.map(item => `- ${item.name} (ID: ${item._id}, Price: ₹${item.price})`).join('\n');

    const systemPrompt = `You are an AI order and reservation parser for a restaurant.
You MUST output ONLY a valid JSON object.

Available Menu:
${menuListStr}

Rules:
1. IF the user is asking to BOOK or RESERVE a table/seat/party (e.g., "book table for 4", "reserve seat at 7 PM"):
   Return JSON:
   {
     "isReservation": true,
     "guestCount": <number_of_guests or 2>,
     "bookingTime": "<extracted_time_or_date>"
   }

2. IF the user is ordering FOOD items from the menu:
   Return JSON:
   {
     "isReservation": false,
     "tableNumber": "<table number if mentioned, else '01'>",
     "items": [
       {
         "menuItemId": "<matching_id_from_menu>",
         "name": "<matching_item_name>",
         "quantity": <number>,
         "customization": "<any special instructions or empty string>"
       }
     ]
   }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(responseText);

  } catch (err) {
    console.error('⚠️ Groq AI Text Parser Error, using regex fallback:', err.message);
    return fallbackRegexParse(userText, menuItems);
  }
}

// 🎙️ Voice Order Parser (Transcribed text or Direct Audio fallback)
export async function parseAudioOrder(audioBuffer, mimeType, menuItems) {
  try {
    // Note: Groq Whisper API for speech-to-text
    if (process.env.GROQ_API_KEY && audioBuffer) {
      const file = new File([audioBuffer], 'speech.ogg', { type: mimeType || 'audio/ogg' });
      const transcription = await groq.audio.transcriptions.create({
        file: file,
        model: 'whisper-large-v3',
        language: 'en'
      });

      if (transcription && transcription.text) {
        return parseTextOrder(transcription.text, menuItems);
      }
    }
    
    throw new Error('Groq Voice API unavailable or empty audio.');
  } catch (err) {
    console.error('⚠️ AI Audio Parser Warning:', err.message);
    return {
      isReservation: false,
      tableNumber: '01',
      items: []
    };
  }
}

// 🛡️ Robust Local Fallback (Guarantees no app crashes if API is down)
function fallbackRegexParse(userText, menuItems) {
  const lowerMsg = userText.toLowerCase();

  // Check for Reservation
  if (lowerMsg.includes('reserve') || lowerMsg.includes('book table') || lowerMsg.includes('reservation')) {
    const guestMatch = lowerMsg.match(/(\d+)\s*(?:people|guests|person|seat)/i);
    return {
      isReservation: true,
      guestCount: guestMatch ? parseInt(guestMatch[1]) : 2,
      bookingTime: 'Today Evening'
    };
  }

  // Detect Table Number
  let detectedTable = '01';
  const tableMatch = lowerMsg.match(/(?:table|tbl|t)\s*(\d+)/i);
  if (tableMatch) {
    detectedTable = tableMatch[1].padStart(2, '0');
  }

  let matchedItems = [];
  menuItems.forEach((item) => {
    const itemName = item.name.toLowerCase();
    if (lowerMsg.includes(itemName)) {
      let quantity = 1;
      const digitMatch = lowerMsg.match(new RegExp(`(\\d+)\\s*${itemName}`));
      if (digitMatch) {
        quantity = parseInt(digitMatch[1]);
      } else {
        const wordMatch = lowerMsg.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine|ten)\\b\\s*${itemName}`));
        if (wordMatch && wordToNum[wordMatch[1]]) {
          quantity = wordToNum[wordMatch[1]];
        }
      }

      matchedItems.push({
        menuItemId: item._id,
        name: item.name,
        quantity: quantity,
        customization: 'AI Fallback Order'
      });
    }
  });

  return {
    isReservation: false,
    tableNumber: detectedTable,
    items: matchedItems
  };
}