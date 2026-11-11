import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "MEDIUM" -> "Medium" */
export function formatDifficulty(d: string) {
  return d.charAt(0) + d.slice(1).toLowerCase();
}
