import { useState } from "react";
import { CreditCard, MessageSquare, ArrowRight, ShieldCheck } from "lucide-react";
import type { PaymentInput, TransactionType } from "@/lib/types";
import { demoScenarios } from "@/lib/demoScenarios";
import { formatCurrency } from "@/lib/ui";

interface PayScreenProps {
  onPay: (input: PaymentInput) => void;
}

const accentStyles = {
  safe: "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-100",
  suspicious: "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-amber-100",
  critical: "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-red-100",
};

const accentBadge = {
  safe: "bg-emerald-500",
  suspicious: "bg-amber-500",
  critical: "bg-red-500",
};

const accentExpected: Record<string, string> = {
  safe: "text-emerald-600",
  suspicious: "text-amber-600",
  critical: "text-red-600",
};

export function PayScreen({ onPay }: PayScreenProps) {
  const [receiverUpi, setReceiverUpi] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType>("P2P");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function applyScenario(data: PaymentInput) {
    setReceiverUpi(data.receiverUpi);
    setAmount(String(data.amount));
    setTransactionType(data.transactionType);
    setMessage(data.message ?? "");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!receiverUpi.trim() || !receiverUpi.includes("@")) {
      setError("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");
    onPay({
      receiverUpi: receiverUpi.trim(),
      amount: amt,
      transactionType,
      message: message.trim(),
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Demo scenario cards */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick Demo Scenarios
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {demoScenarios.map((s) => (
            <button
              key={s.label}
              onClick={() => applyScenario(s.data)}
              className={`group rounded-xl border-2 p-4 text-left shadow-sm transition-all hover:shadow-md ${accentStyles[s.accent]}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${accentBadge[s.accent]}`} />
                <span className="text-sm font-bold text-slate-800">{s.label}</span>
              </div>
              <p className="text-xs text-slate-600">{s.description}</p>
              <p className="mt-2 font-mono text-xs text-slate-500">{s.data.receiverUpi}</p>
              <p className={`mt-1 text-xs font-semibold ${accentExpected[s.accent]}`}>
                Expected {s.accent === "safe" ? "LOW" : s.accent === "suspicious" ? "MEDIUM/HIGH" : "CRITICAL"} risk
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Payment form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">New Payment</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Receiver UPI ID
            </label>
            <input
              type="text"
              value={receiverUpi}
              onChange={(e) => setReceiverUpi(e.target.value)}
              placeholder="name@upi"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Transaction Type
            </label>
            <div className="flex gap-2">
              {(["P2P", "Merchant"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransactionType(t)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    transactionType === t
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {t === "P2P" ? "Person to Person" : "Merchant"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Message (optional)
              </span>
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's this for?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Pay Now <ArrowRight className="h-5 w-5" />
        </button>

        {amount && !isNaN(parseFloat(amount)) && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            SecurePay will analyze this payment for risk before completing it.
            Simulated environment — no real money is transferred.
          </p>
        )}
      </form>
    </div>
  );
}
