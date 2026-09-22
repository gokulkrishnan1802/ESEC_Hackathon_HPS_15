import { useState } from "react";
import {
  CreditCard,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { PaymentInput, TransactionType } from "@/lib/types";
import { demoScenarios } from "@/lib/demoScenarios";

interface PayScreenProps {
  onPay: (input: PaymentInput) => void;
}

const accentStyles = {
  safe: "border-emerald-300 bg-emerald-50 hover:border-emerald-400 hover:shadow-emerald-100",
  suspicious:
    "border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-amber-100",
  critical:
    "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-red-100",
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
  const [transactionType, setTransactionType] =
    useState<TransactionType>("P2P");
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
    <div className="mx-auto max-w-5xl px-4 py-8">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
          <ShieldCheck className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          Send Money Securely
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          PaySecure analyzes your payment before processing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Payment Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <CreditCard className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                New Payment
              </h2>
              <p className="text-xs text-slate-500">
                Enter the details to continue
              </p>
            </div>
          </div>

          <div className="space-y-5">

            {/* Receiver */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Receiver UPI ID
              </label>

              <input
                type="text"
                value={receiverUpi}
                onChange={(e) => setReceiverUpi(e.target.value)}
                placeholder="name@upi"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />

              {receiverUpi.includes("@") && (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  ✓ UPI ID format looks valid
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Amount
              </label>

              <div className="flex items-center rounded-xl border border-slate-300 bg-slate-50 px-4 focus-within:border-slate-900 focus-within:bg-white">
                <span className="mr-2 text-2xl font-semibold text-slate-500">
                  ₹
                </span>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent py-3 text-2xl font-semibold text-slate-900 outline-none"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Demo environment — no real money is transferred
              </p>
            </div>

            {/* Transaction Type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Transaction Type
              </label>

              <div className="flex gap-3">
                {(["P2P", "Merchant"] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTransactionType(t)}
                    className={`flex-1 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
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

            {/* Payment Purpose */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Payment Purpose
              </label>

              <div className="flex flex-wrap gap-2">
                {["Personal", "Shopping", "Bills"].map((purpose) => (
                  <button
                    key={purpose}
                    type="button"
                    onClick={() => setMessage(purpose)}
                    className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                      message === purpose
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {purpose}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Message
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </span>
              </label>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's this payment for?"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Check & Pay */}
          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-[0.99]"
          >
            <ShieldCheck className="h-5 w-5" />
            CHECK & PAY
            <ArrowRight className="h-5 w-5" />
          </button>

          <p className="mt-3 text-center text-xs text-slate-400">
            PaySecure will analyze this transaction for risk before completion.
          </p>
        </form>

        {/* Security Panel */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Security Preview
              </h2>

              <p className="text-xs text-slate-500">
                Checks before payment
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <div>
              <p className="text-sm font-semibold text-slate-800">
                ✓ Receiver Check
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Checks receiver-related risk signals.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                ✓ Behaviour Check
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Looks for unusual transaction behaviour.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                ✓ Fraud Indicators
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Identifies suspicious transaction signals.
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-slate-600" />

              <span className="text-xs font-semibold text-slate-700">
                Protected by PaySecure
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Every payment is analyzed for risk before reaching the
              confirmation stage.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Scenarios */}
      <div className="mt-8">

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Demo Scenarios
        </h2>

        <p className="mb-3 text-xs text-slate-400">
          Select a scenario to demonstrate different fraud-risk outcomes.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {demoScenarios.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => applyScenario(s.data)}
              className={`group rounded-xl border-2 p-4 text-left shadow-sm transition-all hover:shadow-md ${accentStyles[s.accent]}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${accentBadge[s.accent]}`}
                />

                <span className="text-sm font-bold text-slate-800">
                  {s.label}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                {s.description}
              </p>

              <p className="mt-2 font-mono text-xs text-slate-500">
                {s.data.receiverUpi}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${accentExpected[s.accent]}`}
              >
                Expected{" "}
                {s.accent === "safe"
                  ? "LOW"
                  : s.accent === "suspicious"
                  ? "MEDIUM/HIGH"
                  : "CRITICAL"}{" "}
                risk
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

