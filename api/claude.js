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
    // 3) Build the full prompt string into a variable
    const fullPrompt = [
      "\u0002system\u0002You are a helpful AI assistant.",
      `\u0002human\u0002${prompt}`,
      "\u0002assistant\u0002"
    ].join("\n");

    // 4) Log the JSON-escaped prompt so we can inspect it in Vercel logs
    console.log(
      "▶️ [CLAUDE] raw prompt (escaped):",
      JSON.stringify({ prompt: fullPrompt })
    );

    // 5) Call the Claude 4 API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.CLAUDE_API_KEY,
        "Anthropic-Version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-4",
        prompt: fullPrompt,
        max_tokens_to_sample: 300
      })
    });

    // 6) If Claude returns an error, forward it
    if (!anthropicRes.ok) {
      const text = await anthropicRes.text();
      console.error("Claude 4 error:", text);
      return res.status(anthropicRes.status).send(text);
    }

    // 7) Parse the successful JSON response
    const data = await anthropicRes.json();
    const completion = data.completion || data.choices?.[0]?.text || "";
    return res.status(200).json({ completion });
  } catch (err) {
    console.error("Fetch exception:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
