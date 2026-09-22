import type { Transaction } from "./types";

const STORAGE_KEY = "securepay_transactions";

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Transaction[];
  } catch {
    return [];
  }
}

export function saveTransaction(txn: Transaction): void {
  const all = loadTransactions();
  all.unshift(txn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function generateTxnId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TXN${num}`;
}
