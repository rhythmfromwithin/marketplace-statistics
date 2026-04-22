import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Platform = "amazon" | "ebay" | "shopify" | "etsy";
export type Availability = "in_stock" | "out_of_stock" | "limited";
export type DeltaDirection = "up" | "down" | "none";

export const PLATFORM_LABELS: Record<Platform, string> = {
  amazon: "Amazon",
  ebay: "eBay",
  shopify: "Shopify",
  etsy: "Etsy",
};

export const PLATFORM_TEXT_COLORS: Record<Platform, string> = {
  amazon: "text-platform-amazon",
  ebay: "text-platform-ebay",
  shopify: "text-platform-shopify",
  etsy: "text-platform-etsy",
};

export const PLATFORM_BG_COLORS: Record<Platform, string> = {
  amazon: "bg-platform-amazon text-platform-amazon",
  ebay: "bg-platform-ebay text-platform-ebay",
  shopify: "bg-platform-shopify text-platform-shopify",
  etsy: "bg-platform-etsy text-platform-etsy",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  limited: "Limited",
};

export const AVAILABILITY_COLORS: Record<Availability, string> = {
  in_stock: "text-price-up",
  out_of_stock: "text-destructive",
  limited: "text-yellow-400",
};

export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatRelativeTime(date: Date | string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
