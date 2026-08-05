"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_BUTTONS = [
  "Find Cheap Flights",
  "Best Destinations",
  "Travel Deals",
  "Visa Help",
];

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");

  function getBotReply(message: string) {
    const text = message.toLowerCase();

    if (text.includes("hello") || text.includes("hi")) {
      return "Hello 👋 I’m JetlyXO AI. I can help you find flights, trains, buses, and travel tips.";
    }

    if (text.includes("flight")) {
      return "✈️ You can search flights using the search box above. Enter your departure city and destination.";
    }

    if (text.includes("train")) {
      return "🚆 Train booking is available in the Train tab. Search trains and click Book Now.";
    }

    if (text.includes("bus")) {
      return "🚌 Bus tickets are available in the Bus section. Choose a route and book instantly.";
    }

    if (text.includes("price")) {
      return "💰 Prices change depending on demand. Booking early usually gives cheaper prices.";
    }

    if (text.includes("cancel")) {
      return "❌ Cancellation depends on airline or operator policy. Most allow cancellation before departure.";
    }

    if (text.includes("visa")) {
      return "🛂 Visa requirements depend on the country you're visiting. I can help guide you.";
    }

    if (text.includes("deal")) {
      return "🔥 Travel deals change daily. Try searching flights to see the best prices.";
    }

    return "🤖 I’m JetlyXO AI. Ask me about flights, trains, buses, visa help, or travel tips!";
  }

  const send = (text: string) => {
    if (!text.trim()) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");

    const reply = getBotReply(text);

    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    }, 600);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy-800/95 backdrop-blur-xl border border-white/10 shadow-glow text-white font-semibold hover:shadow-[0_0_40px_-5px_rgba(79,156,255,0.5)] transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        JetlyXO AI ✈️
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed bottom-6 right-6 w-full max-w-md max-h-[80vh] z-50 flex flex-col rounded-2xl overflow-hidden glass-card border border-white/10 shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >

              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-navy-800/50">
                <span className="font-semibold text-white">JetlyXO AI ✈️</span>

                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px]">

                {messages.length === 0 ? (
                  <>
                    <div className="flex gap-3">
                      <span className="text-2xl">👋</span>
                      <div>
                        <p className="font-medium text-white">Hi 👋 I'm JetlyXO AI.</p>
                        <p className="text-white/80 text-sm mt-1">
                          I can help you find cheap flights, travel deals and visa info.
                        </p>
                      </div>
                    </div>

                    <p className="text-white/60 text-xs">Quick actions:</p>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_BUTTONS.map((label) => (
                        <button
                          key={label}
                          onClick={() => send(label)}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-jetly-accent/20 text-white text-sm font-medium border border-white/10 hover:border-jetly-accent/30 transition"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role === "assistant" && <span className="text-xl">🤖</span>}

                      <p
                        className={`rounded-2xl px-4 py-2 text-sm max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-jetly-accent text-white"
                            : "bg-white/10 text-white/90"
                        }`}
                      >
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}

              </div>

              <div className="p-4 border-t border-white/10 bg-navy-800/30">

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex gap-2"
                >

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about flights, hotels, deals..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
                  />

                  <button
                    type="submit"
                    className="px-4 py-3 rounded-xl bg-jetly-accent text-white font-medium"
                  >
                    Send
                  </button>

                </form>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}