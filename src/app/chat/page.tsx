"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-mesh px-4 pt-6">
      <h1 className="mb-1 text-3xl font-extrabold tracking-tight">
        AI Coach 🤖
      </h1>
      <p className="mb-4 text-sm text-charcoal-500">Training · nutrition · recovery</p>
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <Card className="border-proof-500/20 bg-gradient-to-br from-proof-500/10 to-charcoal-900">
            <span className="text-3xl">🤖</span>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-300">
              Ask about training, nutrition, recovery, or programming. I&apos;m
              in your corner.
            </p>
          </Card>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl border border-proof-500/30 bg-proof-600/20 p-4 text-sm"
                : "mr-8 rounded-2xl border border-charcoal-700 bg-charcoal-900 p-4 text-sm"
            }
          >
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
              {m.role === "user" ? "You" : "Coach 🤖"}
            </span>
            {m.content}
          </motion.div>
        ))}
        {loading && (
          <p className="text-center text-sm text-charcoal-500 animate-pulse">
            Coach is thinking…
          </p>
        )}
      </div>
      <div className="flex gap-2 py-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          className="border-charcoal-700 bg-charcoal-900"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={loading} className="shrink-0">
          Send
        </Button>
      </div>
    </div>
  );
}
