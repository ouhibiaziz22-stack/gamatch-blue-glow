const express = require("express");

const router = express.Router();

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const isConfiguredApiKey = (value) => {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("your_")) return false;
  if (normalized.includes("placeholder")) return false;
  if (normalized.includes("change_me")) return false;
  return normalized.startsWith("sk-");
};

const extractResponseText = (responsePayload) => {
  if (typeof responsePayload?.output_text === "string" && responsePayload.output_text.trim()) {
    return responsePayload.output_text.trim();
  }

  const texts = [];
  if (Array.isArray(responsePayload?.output)) {
    for (const item of responsePayload.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const content of item.content) {
        if (typeof content?.text === "string" && content.text.trim()) {
          texts.push(content.text.trim());
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

const containsArabic = (text) => /[\u0600-\u06FF]/.test(text);

const detectFallbackLanguage = (question) => {
  const q = String(question || "").trim();
  const lower = q.toLowerCase();

  if (containsArabic(q)) return "ar";

  const frenchHints = [
    "bonjour",
    "salut",
    "livraison",
    "paiement",
    "prix",
    "combien",
    "commande",
    "retour",
    "garantie",
    "carte",
    "merci",
    "pc gamer",
  ];

  if (frenchHints.some((hint) => lower.includes(hint))) {
    return "fr";
  }

  return "en";
};

const fallbackMessages = {
  en: {
    empty: "Ask me anything, and I will do my best to help.",
    greeting:
      "Hello. I can help with product advice, shipping, payments, orders, custom builds, and general questions.",
    parts:
      "For PC parts, tell me your budget and main use (gaming, editing, streaming), and I can suggest a balanced setup.",
    price: "Prices are shown in TND. If you share your target budget, I can suggest the best value options.",
    shipping: "Delivery options usually include Standard, Express, and Pickup. You can choose the method during checkout.",
    payment: "Supported payments include card and cash on delivery, depending on your checkout options.",
    warranty: "Warranty and return policy depend on product type. I can help you check details for a specific item.",
    detailed:
      "Great question. Here is a practical answer: I can guide you step by step. Share a bit more detail about \"{question}\" and I will give a precise recommendation.",
    generic: "I am here to help. Ask your question with a little detail and I will give a clear answer.",
  },
  fr: {
    empty: "Posez-moi n'importe quelle question et je ferai de mon mieux pour vous aider.",
    greeting:
      "Bonjour. Je peux vous aider pour les produits, la livraison, les paiements, les commandes, les configurations PC et les questions generales.",
    parts:
      "Pour les composants PC, donnez-moi votre budget et l'usage principal (gaming, montage, streaming), et je vous proposerai une configuration equilibree.",
    price: "Les prix sont affiches en TND. Donnez votre budget cible et je vous propose les meilleures options.",
    shipping:
      "Les options de livraison incluent generalement Standard, Express et Retrait. Vous pouvez choisir a l'etape de paiement.",
    payment: "Les paiements pris en charge incluent la carte et le paiement a la livraison selon les options disponibles.",
    warranty:
      "La garantie et le retour dependent du produit. Je peux vous aider a verifier les details pour un article precis.",
    detailed:
      "Excellente question. Je peux vous guider etape par etape. Donnez un peu plus de details sur \"{question}\" et je vous donnerai une recommandation precise.",
    generic: "Je suis la pour vous aider. Ajoutez un peu de detail et je vous donnerai une reponse claire.",
  },
  ar: {
    empty: "اسالني اي سؤال وساحاول مساعدتك بافضل شكل.",
    greeting: "مرحبا. يمكنني مساعدتك في المنتجات والشحن والدفع والطلبات وتجميعات الكمبيوتر.",
    parts: "بالنسبة لقطع الكمبيوتر، اعطني الميزانية والاستخدام الاساسي وساقترح لك تجميعة متوازنة.",
    price: "الاسعار معروضة بالدينار التونسي. شاركني ميزانيتك وساقترح افضل الخيارات.",
    shipping: "خيارات التوصيل عادة تشمل عادي وسريع واستلام من المتجر حسب التوفر.",
    payment: "الدفع المتاح يشمل البطاقة والدفع عند الاستلام حسب الخيارات المتوفرة عندك.",
    warranty: "الضمان وسياسة الارجاع يختلفان حسب المنتج. اقدر اساعدك في التفاصيل لمنتج محدد.",
    detailed: "سؤال ممتاز. اقدر اساعدك خطوة بخطوة. اعطني تفاصيل اكثر عن \"{question}\" وساعطيك توصية دقيقة.",
    generic: "انا هنا للمساعدة. اكتب سؤالك بتفاصيل اكثر وساعطيك اجابة واضحة.",
  },
};

const buildFallbackReply = (rawQuestion) => {
  const question = String(rawQuestion || "").trim();
  const q = question.toLowerCase();
  const lang = detectFallbackLanguage(question);
  const t = fallbackMessages[lang];
  const greetingRegex = /(^|\s)(hello|hi|hey|salut|bonjour)(\s|$|[!.,?])/i;

  if (!question) {
    return t.empty;
  }

  if (greetingRegex.test(question)) {
    return t.greeting;
  }

  if (q.includes("gpu") || q.includes("cpu") || q.includes("pc") || q.includes("build")) {
    return t.parts;
  }

  if (
    q.includes("price") ||
    q.includes("cost") ||
    q.includes("budget") ||
    q.includes("tnd") ||
    q.includes("prix") ||
    q.includes("combien") ||
    q.includes("سعر") ||
    q.includes("تكلفة") ||
    q.includes("ميزانية")
  ) {
    return t.price;
  }

  if (q.includes("ship") || q.includes("delivery") || q.includes("livraison") || q.includes("شحن") || q.includes("توصيل")) {
    return t.shipping;
  }

  if (
    q.includes("pay") ||
    q.includes("payment") ||
    q.includes("cash") ||
    q.includes("card") ||
    q.includes("paiement") ||
    q.includes("carte") ||
    q.includes("دفع") ||
    q.includes("بطاقة")
  ) {
    return t.payment;
  }

  if (
    q.includes("warranty") ||
    q.includes("return") ||
    q.includes("refund") ||
    q.includes("garantie") ||
    q.includes("retour") ||
    q.includes("ضمان") ||
    q.includes("ارجاع")
  ) {
    return t.warranty;
  }

  if (q.endsWith("?") || q.length >= 8) {
    return t.detailed.replace("{question}", question);
  }

  return t.generic;
};

router.get("/health", (_req, res) => {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!isConfiguredApiKey(apiKey)) {
    return res.status(200).json({ status: "misconfigured" });
  }
  return res.status(200).json({ status: "connected", model: OPENAI_MODEL });
});

router.post("/", async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY || "";

  try {
    const message = String(req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    if (!isConfiguredApiKey(apiKey)) {
      return res.status(200).json({
        reply: buildFallbackReply(message),
        mode: "fallback",
        reason: "ai_key_missing_or_invalid",
      });
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
        Authorization: `Bearer ${apiKey}`,
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
      return res.status(200).json({
        reply: buildFallbackReply(message),
        mode: "fallback",
        reason: data?.error?.message || "openai_request_failed",
      });
    }

    const reply = extractResponseText(data);
    if (!reply) {
      return res.status(200).json({
        reply: buildFallbackReply(message),
        mode: "fallback",
        reason: "empty_model_response",
      });
    }

    return res.status(200).json({ reply, model: data?.model || OPENAI_MODEL, mode: "ai" });
  } catch (error) {
    const message = String(req.body?.message || "").trim();
    return res.status(200).json({
      reply: buildFallbackReply(message),
      mode: "fallback",
      reason: error instanceof Error ? error.message : "unexpected_server_error",
    });
  }
});

module.exports = router;
