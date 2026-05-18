import { NextResponse } from "next/server";
import OpenAI from "openai";
import { AI_SYSTEM_PROMPT } from "@/lib/config";

export async function POST(req: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages, context } = await req.json();

  const contextBlock = context
    ? `\n\nCurrent workout context:\n${JSON.stringify(context, null, 2)}`
    : "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT + contextBlock },
      ...messages,
    ],
    max_tokens: 500,
  });

  return NextResponse.json({
    message: completion.choices[0]?.message?.content ?? "",
  });
}
