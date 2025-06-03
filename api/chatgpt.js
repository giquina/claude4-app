// api/chatgpt.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Expect a JSON body like { "prompt": "some text" }
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt" });
  }

  try {
    // Build an array of messages for ChatGPT
    const messages = [
      { role: "system", content: "You are a helpful AI assistant." },
      { role: "user",   content: prompt }
    ];

    // Call OpenAI’s Chat Completions endpoint
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Make sure you've set OPENAI_API_KEY in Vercel's Environment Variables
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    // If OpenAI returns an error, forward it
    if (!openaiRes.ok) {
      const errorBody = await openaiRes.json();
      console.error("OpenAI error:", errorBody);
      return res.status(openaiRes.status).json(errorBody);
    }

    // Parse the successful JSON response
    const data = await openaiRes.json();
    // The assistant’s reply lives in data.choices[0].message.content
    const completion = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ completion });
  } catch (err) {
    console.error("ChatGPT fetch exception:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

