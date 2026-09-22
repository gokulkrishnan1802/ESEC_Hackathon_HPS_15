import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck, User, Activity, FileWarning } from "lucide-react";
import type { PaymentInput, RiskResult, TransactionStatus, Transaction } from "@/lib/types";
import { analyzeTransaction } from "@/lib/fraudEngine";
import { generateTxnId, saveTransaction } from "@/lib/storage";
import { riskColors, formatCurrency } from "@/lib/ui";

interface AnalysisScreenProps {
  input: PaymentInput;
  history: Transaction[];
  onDone: () => void;
}

type Phase = "analyzing" | "result";

const analysisSteps = [
  { icon: FileWarning, label: "Transaction details" },
  { icon: Activity, label: "Transaction behavior" },
  { icon: User, label: "Beneficiary information" },
  { icon: ShieldAlert, label: "Fraud indicators" },
];

const severityDot: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

export function AnalysisScreen({ input, history, onDone }: AnalysisScreenProps) {
  const [phase, setPhase] = useState<Phase>("analyzing");
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [status, setStatus] = useState<TransactionStatus | null>(null);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s < analysisSteps.length - 1 ? s + 1 : s));
    }, 280);
    const doneTimer = setTimeout(() => {
      const r = analyzeTransaction(input, { history });
      setResult(r);
      setPhase("result");
    }, 1400);
    return () => {
      clearInterval(stepTimer);
      clearTimeout(doneTimer);
    };
  }, [input, history]);

  function persist(resultData: RiskResult, txnStatus: TransactionStatus) {
    const txn = {
      ...input,
      id: generateTxnId(),
      timestamp: Date.now(),
      risk: resultData,
      status: txnStatus,
    };
    saveTransaction(txn);
    setStatus(txnStatus);
  }

  // ---- Analyzing phase ----
  if (phase === "analyzing") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Analyzing transaction…</h2>
          <p className="mt-1 text-sm text-slate-500">
            Running risk assessment on {formatCurrency(input.amount)} → {input.receiverUpi}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {analysisSteps.map((step, i) => {
            const Icon = step.icon;
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
                  done
                    ? "border-emerald-200 bg-emerald-50"
                    : active
                      ? "border-slate-300 bg-white shadow-sm"
                      : "border-slate-100 bg-slate-50 opacity-50"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-700" />
                ) : (
                  <Icon className="h-5 w-5 text-slate-400" />
                )}
                <span
                  className={`text-sm font-medium ${
                    done ? "text-emerald-700" : active ? "text-slate-800" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Result phase ----
  if (!result) return null;
  const colors = riskColors[result.risk_level];

  // Completion screen after action
  if (status) {
    const prevented = status === "CANCELLED" || status === "BLOCKED";
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
              prevented ? "bg-red-50" : "bg-emerald-50"
            }`}
          >
            {prevented ? (
              <ShieldAlert className="h-8 w-8 text-red-600" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {prevented ? "Payment cancelled for your safety" : "Payment completed"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {prevented
              ? "The payment was stopped before completion. No money was transferred."
              : status === "USER_CONFIRMED"
                ? "Mock transaction completed after user confirmation. No real money was transferred."
                : "Mock transaction completed successfully. No real money was transferred."}
          </p>
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-800">{formatCurrency(input.amount)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Receiver</span>
              <span className="font-semibold text-slate-800">{input.receiverUpi}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Risk Score</span>
              <span className={`font-semibold ${colors.text}`}>{result.risk_score}/100 ({result.risk_level})</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold text-slate-800">{status}</span>
            </div>
          </div>
          <button
            onClick={onDone}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Low risk result
  if (result.risk_level === "LOW") {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold text-emerald-700">Payment Appears Safe</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> LOW RISK
            </div>
            <div className="mt-4 text-4xl font-bold text-slate-900">
              {result.risk_score}
              <span className="text-lg text-slate-400">/100</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {result.reasons.length === 0
                ? "No significant risk indicators detected."
                : "No major risk indicators detected."}
            </p>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-800">{formatCurrency(input.amount)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Receiver</span>
              <span className="font-semibold text-slate-800">{input.receiverUpi}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-500">Type</span>
              <span className="font-semibold text-slate-800">{input.transactionType}</span>
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minor Factors</h3>
              {result.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDot[r.severity]}`} />
                  <span className="flex-1 text-sm text-slate-600">{r.label}</span>
                  <span className="text-xs font-semibold text-slate-400">+{r.weight}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={onDone}
              className="flex-1 rounded-xl border-2 border-slate-300 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => persist(result, "COMPLETED")}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Proceed with Payment
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Prototype risk thresholds — not official banking thresholds.
          </p>
        </div>
      </div>
    );
  }

  // High-risk / medium-risk warning
  const warningTitle =
    result.risk_level === "CRITICAL"
      ? "Critical Risk Payment Detected"
      : result.risk_level === "HIGH"
        ? "High-Risk Transaction"
        : "Potentially Suspicious Transaction";

  const warningDesc =
    result.risk_level === "MEDIUM"
      ? "Some risk indicators were detected. Additional verification recommended."
      : "Multiple risk indicators were detected. Additional verification recommended before proceeding.";

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-8 shadow-sm`}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <ShieldAlert className={`h-8 w-8 ${colors.text}`} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">{warningTitle}</h2>
          <div
            className={`mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold ${colors.text} shadow-sm`}
          >
            <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
            {result.risk_level} RISK
          </div>
          <div className="mt-4 text-4xl font-bold text-slate-900">
            {result.risk_score}
            <span className="text-lg text-slate-400">/100</span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">{warningDesc}</p>
        </div>

        {/* Risk meter */}
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
              style={{ width: `${result.risk_score}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>0</span><span>30</span><span>60</span><span>80</span><span>100</span>
          </div>
        </div>

        {/* Reasons */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Why we're warning you:</h3>
          {result.reasons.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg bg-white px-4 py-2.5 shadow-sm"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${severityDot[r.severity]}`} />
              <span className="flex-1 text-sm text-slate-700">{r.label}</span>
              <span className="text-xs font-semibold text-slate-400">+{r.weight}</span>
            </div>
          ))}
        </div>

        {/* Transaction summary */}
        <div className="mt-5 rounded-lg bg-white/70 px-4 py-3 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-800">{formatCurrency(input.amount)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-slate-500">Receiver</span>
            <span className="font-semibold text-slate-800">{input.receiverUpi}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => persist(result, "CANCELLED")}
            className="flex-1 rounded-xl border-2 border-red-500 py-3 font-semibold text-red-600 transition hover:bg-red-50"
          >
            Cancel Payment
          </button>
          <button
            onClick={() => persist(result, "USER_CONFIRMED")}
            className="flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Proceed Anyway
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          This is a risk assessment, not a definitive fraud determination.
          Prototype thresholds — not official banking thresholds.
        </p>
      </div>
    </div>
  );
}
