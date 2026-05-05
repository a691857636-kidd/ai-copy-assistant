const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
  }

  const prompt = req.body && typeof req.body.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const upstream = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const payload = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      const message =
        (payload && payload.error && payload.error.message) ||
        (payload && payload.error) ||
        "DeepSeek API request failed";
      return res.status(upstream.status).json({ error: String(message) });
    }

    const text =
      payload &&
      payload.choices &&
      payload.choices[0] &&
      payload.choices[0].message &&
      payload.choices[0].message.content
        ? String(payload.choices[0].message.content)
        : "";

    return res.status(200).json({ text });
  } catch (err) {
    return res.status(500).json({
      error: err && err.message ? err.message : "Server Error",
    });
  }
};
