import { useState } from "react";
import { History as HistoryIcon, ChevronDown, ChevronUp, Trash2, Inbox } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { riskColors, formatCurrency, formatTime } from "@/lib/ui";

interface HistoryScreenProps {
  transactions: Transaction[];
  onClear: () => void;
}

const statusBadge: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  USER_CONFIRMED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-orange-100 text-orange-700",
  BLOCKED: "bg-red-100 text-red-700",
};

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function HistoryScreen({ transactions, onClear }: HistoryScreenProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>
          {transactions.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {transactions.length}
            </span>
          )}
        </div>
        {transactions.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No transactions yet</p>
          <p className="mt-1 text-xs text-slate-400">
            Make a payment from the Pay screen to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((txn) => {
            const c = riskColors[txn.risk.risk_level];
            const isOpen = expanded === txn.id;
            return (
              <div
                key={txn.id}
                className={`overflow-hidden rounded-xl border ${c.border} bg-white shadow-sm`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : txn.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className={`h-3 w-3 shrink-0 rounded-full ${c.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{txn.id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${statusBadge[txn.status]}`}
                      >
                        {txn.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                      {formatCurrency(txn.amount)} → {txn.receiverUpi}
                    </p>
                    <p className="text-xs text-slate-400">{formatTime(txn.timestamp)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-slate-900">
                      {txn.risk.risk_score}
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                    <div className={`text-xs font-bold ${c.text}`}>{txn.risk.risk_level}</div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-white px-3 py-2">
                        <span className="text-slate-400">Type</span>
                        <p className="font-medium text-slate-700">{txn.transactionType}</p>
                      </div>
                      <div className="rounded bg-white px-3 py-2">
                        <span className="text-slate-400">Time</span>
                        <p className="font-medium text-slate-700">{formatTime(txn.timestamp)}</p>
                      </div>
                    </div>

                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Risk Factors
                    </h4>
                    {txn.risk.reasons.length === 0 ? (
                      <p className="text-sm text-slate-500">No risk indicators detected.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {txn.risk.reasons.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2 text-slate-700">
                              <span className={`h-2 w-2 rounded-full ${severityDot[r.severity]}`} />
                              {r.label}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">+{r.weight}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
