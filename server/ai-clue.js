const axios = require("axios");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

function buildPrompt(words) {
  return [
    "You are helping in a Codenames-style game.",
    "Given ONLY your team's unrevealed target words, suggest one safe clue.",
    "Return strictly JSON with shape: {\"word\": string, \"number\": number}.",
    "Rules:",
    "- clue word must be one lowercase word",
    "- no spaces, hyphens, numbers, or punctuation",
    "- number must be an integer between 1 and 4",
    `Target words: ${words.join(", ")}`,
  ].join("\n");
}

function parseSuggestion(content) {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const jsonChunk = trimmed.slice(start, end + 1);

  try {
    const parsed = JSON.parse(jsonChunk);

    if (!parsed || typeof parsed.word !== "string") {
      return null;
    }

    const word = parsed.word.toLowerCase().trim();
    const number = Number(parsed.number);

    if (!/^[a-z]+$/.test(word)) {
      return null;
    }

    if (!Number.isInteger(number) || number < 1 || number > 4) {
      return null;
    }

    return { word, number };
  } catch {
    return null;
  }
}

async function generateAiClue(words, apiKey) {
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  if (!Array.isArray(words) || words.length === 0) {
    throw new Error("No target words available for AI clue generation");
  }

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: MODEL,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Respond only with valid JSON.",
        },
        {
          role: "user",
          content: buildPrompt(words),
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 20000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content ?? "";
  const suggestion = parseSuggestion(content);

  if (!suggestion) {
    throw new Error("AI returned an invalid clue format");
  }

  return suggestion;
}

module.exports = {
  generateAiClue,
};
