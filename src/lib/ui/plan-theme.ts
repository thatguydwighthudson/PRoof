/** Presentation-only helpers — plan name → emoji & accent colors */

export type PlanTheme = {
  emoji: string;
  border: string;
  accent: string;
  badge: string;
  glow: string;
};

const DEFAULT: PlanTheme = {
  emoji: "🏋️",
  border: "border-l-charcoal-500",
  accent: "text-charcoal-300",
  badge: "bg-charcoal-500/20 text-charcoal-300",
  glow: "shadow-charcoal-500/10",
};

export function getPlanTheme(planName: string): PlanTheme {
  const n = planName.toLowerCase();
  if (n.includes("push")) {
    return {
      emoji: "🔴",
      border: "border-l-red-500",
      accent: "text-red-400",
      badge: "bg-red-500/15 text-red-300",
      glow: "shadow-red-500/20",
    };
  }
  if (n.includes("pull")) {
    return {
      emoji: "🔵",
      border: "border-l-blue-500",
      accent: "text-blue-400",
      badge: "bg-blue-500/15 text-blue-300",
      glow: "shadow-blue-500/20",
    };
  }
  if (n.includes("leg")) {
    return {
      emoji: "🟢",
      border: "border-l-green-500",
      accent: "text-green-400",
      badge: "bg-green-500/15 text-green-300",
      glow: "shadow-green-500/20",
    };
  }
  if (n.includes("recovery") || n.includes("rest") || n.includes("active")) {
    return {
      emoji: "🌿",
      border: "border-l-teal-500",
      accent: "text-teal-400",
      badge: "bg-teal-500/15 text-teal-300",
      glow: "shadow-teal-500/20",
    };
  }
  return DEFAULT;
}

export const REST_QUOTES = [
  "Recovery is where growth happens.",
  "Rest today, dominate tomorrow.",
  "Your muscles are rebuilding. Trust the process.",
  "Champions schedule rest on purpose.",
  "Sleep is part of the program.",
];

export function randomRestQuote(): string {
  return REST_QUOTES[Math.floor(Math.random() * REST_QUOTES.length)];
}
