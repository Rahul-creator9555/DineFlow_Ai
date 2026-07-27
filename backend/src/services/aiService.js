import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 💬 Text Order & Reservation Parser
export async function parseTextOrder(userText, menuItems) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const menuListStr = menuItems.map(item => `- ${item.name} (ID: ${item._id}, Price: ₹${item.price})`).join('\n');

    const prompt = `
You are an AI order and reservation parser for a restaurant.

Available Menu:
${menuListStr}

User Input: "${userText}"

Rules:
1. IF the user is asking to BOOK or RESERVE a table/seat/party (e.g., "book table for 4", "reserve seat at 7 PM", "seat for 2 people"):
   Return ONLY JSON in this format:
   {
     "isReservation": true,
     "guestCount": <number_of_guests or 2>,
     "bookingTime": "<extracted_time_or_date_or_evening>"
   }

2. IF the user is ordering FOOD items from the menu:
   Return ONLY JSON in this format:
   {
     "isReservation": false,
     "tableNumber": "<table number if mentioned, else default '01'>",
     "items": [
       {
         "menuItemId": "<matching_id_from_menu>",
         "name": "<matching_item_name>",
         "quantity": <number>,
         "customization": "<any special instructions or empty string>"
       }
     ]
   }

Return strictly valid JSON only. Do not add markdown backticks or extra text.
`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim();

    // Clean JSON string
    const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('AI Text Parser Error:', err);
    throw new Error('Failed to parse text input');
  }
}

// 🎙️ Voice Order & Reservation Parser
export async function parseAudioOrder(audioBuffer, mimeType, menuItems) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const menuListStr = menuItems.map(item => `- ${item.name} (ID: ${item._id}, Price: ₹${item.price})`).join('\n');

    const base64Audio = audioBuffer.toString('base64');

    const audioPart = {
      inlineData: {
        data: base64Audio,
        mimeType: mimeType || 'audio/ogg',
      },
    };

    const prompt = `
Listen to this voice recording for a restaurant order or reservation.

Available Menu:
${menuListStr}

Rules:
1. IF the user is asking to BOOK/RESERVE a table, seat, or party in the voice note (e.g. "Reserve a table for 4 people at 8 PM"):
   Return ONLY JSON:
   {
     "isReservation": true,
     "guestCount": <number_of_guests_detected_or_2>,
     "bookingTime": "<detected_time_or_date>"
   }

2. IF the user is ORDERING FOOD:
   Return ONLY JSON:
   {
     "isReservation": false,
     "tableNumber": "<table_number_if_spoken_else_'01'>",
     "items": [
       {
         "menuItemId": "<matching_id_from_menu>",
         "name": "<matching_item_name>",
         "quantity": <number>,
         "customization": "<special requests>"
       }
     ]
   }

Return strictly valid JSON only without backticks or prose.
`;

    const result = await model.generateContent([prompt, audioPart]);
    const textResponse = result.response.text().trim();

    const cleanJson = textResponse.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('AI Audio Parser Error:', err);
    throw new Error('Failed to parse audio recording');
  }
}