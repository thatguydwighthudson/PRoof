import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function youtubeSearchUrl(query: string | null | undefined): string {
  if (!query) return "https://www.youtube.com/results?search_query=exercise+form";
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
