// api/claude.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  // 1) Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // 2) Expect a JSON body like { "prompt": "some text" }
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing or invalid prompt" });
  }

  try {
    // 3) Call the Claude 4 API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
  headers: {
  "Content-Type": "application/json",
  "x-api-key": process.env.CLAUDE_API_KEY,
  "anthropic-version": "2023-06-01"
},

      body: JSON.stringify({
        model: "claude-4",
        prompt: `\u0002human: ${prompt}\n\u0002assistant:`,
        max_tokens_to_sample: 300
      })
    });

    // 4) If Claude returns an error, forward it
    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error("Claude 4 error:", text);
      return res.status(anthropicRes.status).send(text);
    }

    // 5) Parse the successful JSON response
    const data = await anthropicRes.json();
    const completion = data.completion || data.choices?.[0]?.text || "";
    return res.status(200).json({ completion });
  } catch (err) {
    console.error("Fetch exception:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
