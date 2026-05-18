"use client";

import { useState } from "react";
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
    sets: { reps: number | null; weightKg: number | null; rpe: number | null; isCompleted: boolean }[];
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
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <h2 className="font-bold">AI Coach</h2>
        <button type="button" onClick={onClose} aria-label="Close">
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Ask about form, programming, or recovery for {exercise.exercise.name}.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-8 rounded-xl bg-emerald-600/20 p-3 text-sm"
                : "mr-8 rounded-xl bg-zinc-800 p-3 text-sm"
            }
          >
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-zinc-800 p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach…"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <Button onClick={send} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}
