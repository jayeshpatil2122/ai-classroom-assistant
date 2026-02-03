// api/brain.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Vercel will automatically find this Key in the Settings later
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 1. Setup "CORS" (Allows your Mobile App to talk to this Server)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any phone to connect
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle the "Handshake" (Browsers/Apps check if the server is safe first)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Only allow POST requests (Sending data)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    // 3. Receive Audio Data from the Phone
    // The phone will send: { "audioData": "BASE64_STRING_HERE" }
    const { audioData } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    // 4. Send to Gemini (The Brain)
    // We use "gemini-2.5-flash" because we confirmed you have access to it!
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an intelligent classroom assistant. 
      Listen to this audio clip (Marathi/Hindi/English).
      1. Identify if a specific academic question was asked.
      2. If YES: Output JSON format: { "isQuestion": true, "question": "...", "answer": "..." }
      3. If NO: Output JSON format: { "isQuestion": false, "summary": "..." }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: audioData, 
          mimeType: "audio/mp3",
        },
      },
    ]);

    const responseText = result.response.text();

    // 5. Send the Answer back to the Phone
    return res.status(200).json({ result: responseText });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}