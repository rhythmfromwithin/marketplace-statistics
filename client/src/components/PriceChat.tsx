import { trpc } from "@/lib/trpc";
import { useLang } from "@/contexts/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Mic,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
};

const PROMPT_ICONS = [TrendingDown, TrendingUp, Sparkles, Bot];

export default function PriceChat() {
  const { t } = useLang();
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const askMutation = trpc.chat.ask.useMutation({
    onSuccess: async (data) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading ? { ...m, content: data.content, loading: false } : m
        )
      );

      if (data.action?.type === "product_tracked" && data.action.trackedProductId) {
        await Promise.all([
          utils.products.list.invalidate(),
          utils.prices.dashboard.invalidate(),
          utils.prices.history.invalidate(),
        ]);
      }
    },
    onError: (err) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.loading
            ? {
                ...m,
                content: t.chatError,
                loading: false,
              }
            : m
        )
      );
    },
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || askMutation.isPending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };

    const history = messages
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");

    askMutation.mutate({ message: trimmed, history });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const clearChat = () => {
    setMessages([]);
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Backdrop overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-0"
        style={{ width: "min(680px, calc(100vw - 2rem))" }}
      >
        {/* Chat panel — expands above the input bar */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full mb-2 rounded-2xl overflow-hidden"
              style={{
                background: "#ffffff",
                border: "1px solid #ebeced",
                boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "#ebeced" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-lg flex items-center justify-center"
                    style={{ background: "#0166fe" }}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#1c222b" }}>
                    Price Intel AI
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#f6f8ff", color: "#0166fe" }}
                  >
                    {t.chatLiveData ?? "Live data"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {hasMessages && (
                    <button
                      onClick={clearChat}
                      className="text-xs px-2 py-1 rounded-md transition-colors hover:bg-gray-100"
                      style={{ color: "#9ba0a8" }}
                    >
                      {t.chatClear ?? "Clear"}
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                    style={{ color: "#9ba0a8" }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "380px", minHeight: hasMessages ? "200px" : "auto" }}
              >
                {!hasMessages ? (
                  /* Suggested prompts */
                  <div className="p-4">
                    <p className="text-xs font-medium mb-3" style={{ color: "#9ba0a8" }}>
                      {t.chatPlaceholder.toUpperCase()}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {t.chatSuggestedPrompts.map((text, i) => {
                        const Icon = PROMPT_ICONS[i % PROMPT_ICONS.length]!;
                        return (
                          <button
                            key={text}
                            onClick={() => sendMessage(text)}
                            className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                            style={{
                              background: "#f6f8ff",
                              border: "1px solid #ebeced",
                              color: "#323840",
                            }}
                          >
                            <Icon
                              className="h-4 w-4 mt-0.5 shrink-0"
                              style={{ color: "#0166fe" }}
                            />
                            <span className="text-xs leading-relaxed">{text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Message thread */
                  <div className="p-4 space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: "#0166fe" }}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                            msg.role === "user"
                              ? "rounded-tr-sm"
                              : "rounded-tl-sm"
                          }`}
                          style={
                            msg.role === "user"
                              ? { background: "#0166fe", color: "#ffffff" }
                              : { background: "#f6f8ff", color: "#1c222b", border: "1px solid #ebeced" }
                          }
                        >
                          {msg.loading ? (
                            <div className="flex items-center gap-1.5 py-1">
                              <span
                                className="h-1.5 w-1.5 rounded-full animate-bounce"
                                style={{ background: "#0166fe", animationDelay: "0ms" }}
                              />
                              <span
                                className="h-1.5 w-1.5 rounded-full animate-bounce"
                                style={{ background: "#0166fe", animationDelay: "150ms" }}
                              />
                              <span
                                className="h-1.5 w-1.5 rounded-full animate-bounce"
                                style={{ background: "#0166fe", animationDelay: "300ms" }}
                              />
                            </div>
                          ) : msg.role === "assistant" ? (
                            <div className="prose prose-sm max-w-none" style={{ color: "#1c222b" }}>
                              <Streamdown>{msg.content}</Streamdown>
                            </div>
                          ) : (
                            <span>{msg.content}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The ChatGPT-style pill input bar */}
        <motion.div
          className="w-full rounded-full flex items-center gap-2 px-4 py-3"
          style={{
            background: "#ffffff",
            border: "1.5px solid #ebeced",
            boxShadow: isOpen
              ? "0 4px 24px rgba(0,0,0,0.10)"
              : "0 2px 12px rgba(0,0,0,0.08)",
          }}
          animate={{ boxShadow: isOpen ? "0 4px 24px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {/* + button */}
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100"
            style={{ color: "#9ba0a8" }}
            onClick={() => {
              clearChat();
              setIsOpen(true);
            }}
            title={t.chatNewConvo}
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Input */}
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={t.chatPlaceholder}
            className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
            style={{
              color: "#1c222b",
              maxHeight: "120px",
              overflowY: "auto",
              lineHeight: "1.5",
            }}
          />

          {/* Mic icon */}
          <button
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100"
            style={{ color: "#9ba0a8" }}
            title={t.chatVoiceHint}
            onClick={() => {}}
          >
            <Mic className="h-4 w-4" />
          </button>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || askMutation.isPending}
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all"
            style={{
              background: input.trim() && !askMutation.isPending ? "#0166fe" : "#e8f0fe",
              color: input.trim() && !askMutation.isPending ? "#ffffff" : "#9ba0a8",
              transform: "scale(1)",
            }}
            title={t.chatSend}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </>
  );
}
