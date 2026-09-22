import type { RiskLevel } from "@/lib/types";

export const riskColors: Record<
  RiskLevel,
  { bg: string; text: string; border: string; ring: string; bar: string; dot: string }
> = {
  LOW: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    ring: "ring-emerald-500/30",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    ring: "ring-amber-500/30",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  HIGH: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    ring: "ring-orange-500/30",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
  },
  CRITICAL: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    ring: "ring-red-500/30",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
};

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
