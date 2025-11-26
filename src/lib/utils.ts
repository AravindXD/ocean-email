import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCategoryColor(category: string): string {
  // Hardcoded colors for default categories
  switch (category) {
    case "Important": return "bg-red-100 text-red-800 border-red-200";
    case "Newsletter": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Spam": return "bg-gray-100 text-gray-800 border-gray-200";
    case "To-Do": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Uncategorized": return "bg-gray-50 text-gray-600 border-gray-200";
  }

  // Dynamic colors for custom categories
  const colors = [
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "bg-lime-100 text-lime-800 border-lime-200",
  ];

  // Simple hash to pick a consistent color
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
