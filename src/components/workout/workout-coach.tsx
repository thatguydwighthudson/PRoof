"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Message = { role: "user" | "assistant"; content: string };

export function WorkoutCoach({
  session,
  exercise,
  onClose,
}: {
  session: { id: number; isDeload: boolean };
  exercise: {
    exercise: { name: string };
    sets: {
      reps: number | null;
      weightKg: number | null;
      rpe: number | null;
      isCompleted: boolean;
    }[];
    notes: string | null;
  };
  onClose: () => void;
}) {
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
        body: JSON.stringify({
          messages: next,
          context: {
            exercise: exercise.exercise.name,
            sets: exercise.sets,
            notes: exercise.notes,
            isDeload: session.isDeload,
          },
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      className="fixed inset-0 z-50 flex flex-col bg-charcoal-950 pt-[max(1rem,env(safe-area-inset-top))]"
    >
      <div className="flex items-center justify-between border-b border-charcoal-800 px-4 py-4">
        <div>
          <h2 className="text-lg font-extrabold">🤖 Ask your coach</h2>
          <p className="text-xs text-charcoal-500">{exercise.exercise.name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-charcoal-800 text-charcoal-300 hover:bg-charcoal-700"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="rounded-2xl bg-charcoal-900 p-4 text-sm text-charcoal-400">
            Form, cues, pacing — ask anything about{" "}
            <strong className="text-charcoal-200">{exercise.exercise.name}</strong>.
          </p>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              m.role === "user"
                ? "ml-6 rounded-2xl border border-proof-500/30 bg-proof-600/20 p-3 text-sm"
                : "mr-6 rounded-2xl bg-charcoal-800 p-3 text-sm"
            }
          >
            {m.content}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-charcoal-800 p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          className="border-charcoal-700 bg-charcoal-900"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={loading}>
          Send
        </Button>
      </div>
    </motion.div>
  );
}
