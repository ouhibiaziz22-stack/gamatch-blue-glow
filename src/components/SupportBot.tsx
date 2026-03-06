import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, User, X } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "bot" | "user";
  text: string;
};

const quickQuestions = [
  "What are your best GPUs?",
  "How long is shipping?",
  "Can I pay on delivery?",
];

const getFallbackReply = (question: string) => {
  const q = question.toLowerCase();

  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return "Hello. I can help with products, orders, delivery, payment, and custom PC builds.";
  }

  if (q.includes("gpu") || q.includes("cpu") || q.includes("build") || q.includes("pc")) {
    return "Check Products for GPUs and CPUs, or use Custom Build to configure your full PC and see the live total in TND.";
  }

  if (q.includes("ship") || q.includes("delivery") || q.includes("livraison")) {
    return "Shipping options are Standard (48h), Express (24h), and Pickup. You can choose your preferred method at checkout.";
  }

  if (q.includes("pay") || q.includes("payment") || q.includes("card") || q.includes("cash") || q.includes("wallet")) {
    return "At checkout you can pay by card, cash on delivery, bank transfer, or wallet.";
  }

  if (q.includes("price") || q.includes("cost") || q.includes("tnd")) {
    return "All prices are displayed in TND. Add items to cart to see your final total before payment.";
  }

  if (q.includes("return") || q.includes("refund") || q.includes("warranty")) {
    return "Most products include warranty and return support. Open a product page for details, or contact support for a specific item.";
  }

  return "Good question. I can help with products, cart, payment, delivery, and custom builds. Ask me anything about your order.";
};

const API_URL = (import.meta.env.VITE_CHAT_API_URL as string | undefined) || "/api/chat";

const SupportBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "bot", text: "Got any questions? I am happy to help." },
  ]);

  const listRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setUsingFallback(false);

    const historyPayload = [...messages, userMessage].map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("AI chat request failed");
      }

      const data = (await response.json()) as { reply?: string };
      const answer = (data.reply || "").trim();

      if (!answer) {
        throw new Error("AI returned empty response");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: answer,
        },
      ]);
    } catch {
      setUsingFallback(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: getFallbackReply(text),
        },
      ]);
    } finally {
      timeoutRef.current = setTimeout(() => setIsTyping(false), 650);
    }
  };

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, open]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[70]">
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 mr-1 max-w-[260px] rounded-xl border border-border bg-card/95 px-3 py-2 text-sm text-foreground shadow-xl backdrop-blur-sm"
          >
            Got any questions? I am happy to help.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="mb-3 w-[min(92vw,390px)] rounded-2xl border border-primary/25 bg-gamatch-black/95 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg gamatch-accent-gradient text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Gamatech Assistant</p>
                  <p className="text-xs text-muted-foreground">{usingFallback ? "Fallback mode" : "AI online"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border px-3 py-2">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => sendMessage(item)}
                    className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div ref={listRef} className="max-h-[340px] min-h-[300px] space-y-3 overflow-y-auto px-3 py-3">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "bot" && (
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <p
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "gamatch-accent-gradient text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {message.text}
                  </p>
                  {message.role === "user" && (
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </span>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Bot className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex items-center gap-1 rounded-2xl bg-secondary px-3 py-2">
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: dot * 0.12 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="h-11 flex-1 rounded-xl border border-border bg-secondary px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl gamatch-accent-gradient text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="ml-auto inline-flex h-14 w-14 items-center justify-center rounded-full gamatch-accent-gradient text-primary-foreground shadow-[0_10px_30px_hsl(48_100%_50%_/_0.35)]"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>
    </div>
  );
};

export default SupportBot;
