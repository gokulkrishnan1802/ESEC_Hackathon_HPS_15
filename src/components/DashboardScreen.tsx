import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Inbox,
  IndianRupee,
  Info,
} from "lucide-react";
import type { Transaction, RiskLevel } from "@/lib/types";
import { riskColors, formatCurrency, formatTime } from "@/lib/ui";

interface DashboardScreenProps {
  transactions: Transaction[];
}

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function DashboardScreen({ transactions }: DashboardScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const total = transactions.length;
  const blocked = transactions.filter(
    (t) => t.status === "BLOCKED" || t.status === "CANCELLED"
  ).length;
  const completed = transactions.filter(
    (t) => t.status === "COMPLETED" || t.status === "USER_CONFIRMED"
  ).length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const levels: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const distribution = levels.map((lvl) => ({
    level: lvl,
    count: transactions.filter((t) => t.risk.risk_level === lvl).length,
  }));
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const alerts = transactions.filter(
    (t) => t.risk.risk_level === "HIGH" || t.risk.risk_level === "CRITICAL"
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-bold text-slate-900">Fraud Analyst Dashboard</h2>
      </div>

      {/* Demo disclaimer */}
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <p className="text-xs text-sky-800">
          <span className="font-semibold">Demo Mode:</span> Transaction and reputation data shown in
          this prototype are fictional and used only to demonstrate fraud-risk detection.
        </p>
      </div>

      {/* Summary cards — row 1 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Analyzed"
          value={total}
          color="bg-slate-100 text-slate-700"
        />
        <SummaryCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="Total Amount Analyzed"
          value={formatCurrency(totalAmount)}
          color="bg-blue-100 text-blue-700"
          isText
        />
        <SummaryCard
          icon={<ShieldX className="h-5 w-5" />}
          label="Cancelled / Blocked"
          value={blocked}
          color="bg-red-100 text-red-700"
        />
        <SummaryCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={completed}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Summary cards — row 2 (risk levels) */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {distribution.map((d) => {
          const c = riskColors[d.level];
          return (
            <SummaryCard
              key={d.level}
              icon={<ShieldAlert className="h-5 w-5" />}
              label={`${d.level} Risk`}
              value={d.count}
              color={`${c.bg} ${c.text}`}
            />
          );
        })}
      </div>

      {/* Risk distribution chart */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">Risk Distribution</h3>
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No data yet. Run a transaction to see the distribution.
          </p>
        ) : (
          <div className="space-y-3">
            {distribution.map((d) => {
              const c = riskColors[d.level];
              const pct = (d.count / maxCount) * 100;
              return (
                <div key={d.level} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium text-slate-600">{d.level}</span>
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`flex h-full items-center justify-end rounded-full px-2 ${c.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, d.count > 0 ? 8 : 0)}%` }}
                    >
                      {d.count > 0 && (
                        <span className="text-xs font-bold text-white">{d.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Prototype demonstration thresholds — not official banking thresholds.
        </p>
      </div>

      {/* Recent risk alerts */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700">Recent Risk Alerts</h3>
          <p className="text-xs text-slate-400">High and critical risk transactions</p>
        </div>

        {alerts.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm text-slate-400">No alerts yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((txn) => {
              const c = riskColors[txn.risk.risk_level];
              const isOpen = selected === txn.id;
              return (
                <div key={txn.id}>
                  <button
                    onClick={() => setSelected(isOpen ? null : txn.id)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50"
                  >
                    <span className={`h-3 w-3 shrink-0 rounded-full ${c.dot}`} />
                    <div className="hidden min-w-0 flex-1 sm:block">
                      <span className="font-mono text-xs text-slate-400">{txn.id}</span>
                      <span className="ml-2 text-sm text-slate-700">{txn.receiverUpi}</span>
                    </div>
                    <div className="flex-1 sm:hidden">
                      <span className="font-mono text-xs text-slate-400">{txn.id}</span>
                      <p className="truncate text-sm text-slate-700">{txn.receiverUpi}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-800">
                      {formatCurrency(txn.amount)}
                    </span>
                    <span className={`shrink-0 text-xs font-bold ${c.text}`}>
                      {txn.risk.risk_score}/100
                    </span>
                    <span
                      className={`hidden shrink-0 rounded px-2 py-0.5 text-xs font-semibold sm:inline ${
                        txn.status === "BLOCKED" || txn.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {txn.status}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="bg-slate-50 px-5 py-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Risk Reasons
                        </span>
                        <span className="text-xs text-slate-400">{formatTime(txn.timestamp)}</span>
                      </div>
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
                            <span className="text-xs font-semibold text-slate-400">
                              +{r.weight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <p className={`font-bold text-slate-900 ${isText ? "text-xl" : "text-2xl"}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
