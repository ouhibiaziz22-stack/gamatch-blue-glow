import { createServer } from "node:http";

const PORT = Number(process.env.CHAT_API_PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const json = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    const size = chunks.reduce((acc, c) => acc + c.length, 0);
    if (size > 1_000_000) {
      throw new Error("Request body too large");
    }
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const extractResponseText = (responsePayload) => {
  if (typeof responsePayload?.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const texts = [];
  if (Array.isArray(responsePayload?.output)) {
    for (const item of responsePayload.output) {
      if (Array.isArray(item?.content)) {
        for (const content of item.content) {
          if (typeof content?.text === "string" && content.text.trim()) {
            texts.push(content.text.trim());
          }
        }
      }
    }
  }

  return texts.join("\n").trim();
};

const toOpenAIRole = (role) => {
  if (role === "assistant" || role === "bot") return "assistant";
  return "user";
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  if (req.method !== "POST" || req.url !== "/api/chat") {
    return json(res, 404, { error: "Not found" });
  }

  if (!OPENAI_API_KEY) {
    return json(res, 500, {
      error: "OPENAI_API_KEY is missing on server.",
    });
  }

  try {
    const body = await parseBody(req);
    const message = String(body?.message || "").trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return json(res, 400, { error: "message is required" });
    }

    const conversation = history
      .filter((item) => item && typeof item.text === "string" && item.text.trim())
      .slice(-10)
      .map((item) => ({
        role: toOpenAIRole(item.role),
        content: item.text.trim(),
      }));

    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions:
          "You are Gamatech's website assistant. Be concise, friendly, and practical. If unsure, say what you know and suggest next steps.",
        input: [...conversation, { role: "user", content: message }],
      }),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return json(res, upstream.status, {
        error: data?.error?.message || "OpenAI request failed",
      });
    }

    const reply = extractResponseText(data);
    if (!reply) {
      return json(res, 502, { error: "Model returned an empty response" });
    }

    return json(res, 200, { reply, model: data?.model || OPENAI_MODEL });
  } catch (error) {
    return json(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`AI chat API listening on http://localhost:${PORT}/api/chat`);
});

