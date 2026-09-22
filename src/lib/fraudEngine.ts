import type { PaymentInput, FraudSignals, RiskLevel, RiskReason, RiskResult, Transaction } from "./types";
import { getReputation, hasScamPattern } from "./reputation";

export interface AnalysisContext {
  history: Transaction[];
}

/**
 * Modular fraud risk engine — rule-based prototype.
 * Can later be replaced with a backend API or ML model.
 */
export function analyzeTransaction(input: PaymentInput, ctx: AnalysisContext): RiskResult {
  const signals = deriveSignals(input, ctx);
  const reasons: RiskReason[] = [];

  if (signals.newBeneficiary) {
    reasons.push({ label: "You have not paid this receiver before", weight: 15, severity: "medium" });
  }

  if (signals.firstTransaction) {
    reasons.push({ label: "First transaction with this receiver", weight: 15, severity: "medium" });
  }

  if (signals.amountAnomaly) {
    reasons.push({ label: "Amount is significantly higher than your usual pattern", weight: 20, severity: "high" });
  }

  if (signals.unusualTime) {
    reasons.push({ label: "Unusual transaction time", weight: 10, severity: "medium" });
  }

  if (signals.receiverReported) {
    reasons.push({ label: "Receiver has prior reports in the demo reputation database", weight: 25, severity: "critical" });
  }

  if (signals.scamPattern) {
    reasons.push({ label: "Receiver ID matches suspicious patterns", weight: 15, severity: "high" });
  }

  if (signals.transactionFrequency) {
    reasons.push({ label: "Multiple rapid transactions detected", weight: 10, severity: "medium" });
  }

  const rawScore = reasons.reduce((sum, r) => sum + r.weight, 0);
  const risk_score = Math.min(rawScore, 100);

  const risk_level: RiskLevel =
    risk_score >= 81 ? "CRITICAL"
    : risk_score >= 61 ? "HIGH"
    : risk_score >= 31 ? "MEDIUM"
    : "LOW";

  const decision = risk_level === "LOW" ? "ALLOW" : "WARN";

  return { risk_score, risk_level, decision, reasons, signals };
}

function deriveSignals(input: PaymentInput, ctx: AnalysisContext): FraudSignals {
  const receiver = input.receiverUpi.toLowerCase().trim();
  const history = ctx.history;

  // A. New beneficiary — never paid this receiver before (any status)
  const priorToReceiver = history.filter(
    (t) => t.receiverUpi.toLowerCase().trim() === receiver
  );
  const newBeneficiary = priorToReceiver.length === 0;

  // B. First transaction — first ever payment to this receiver
  const firstTransaction = priorToReceiver.length === 0;

  // C. Receiver reputation from demo dataset
  const rep = getReputation(input.receiverUpi);
  const receiverReported = rep.reports > 0;

  // D. Amount anomaly — compare against user's historical average
  const completedAmounts = history
    .filter((t) => t.status === "COMPLETED" || t.status === "USER_CONFIRMED")
    .map((t) => t.amount);
  const avgAmount =
    completedAmounts.length > 0
      ? completedAmounts.reduce((a, b) => a + b, 0) / completedAmounts.length
      : 2000; // fictional baseline for new users
  const amountAnomaly = input.amount > avgAmount * 3 && input.amount >= 5000;

  // E. Transaction frequency — 3+ transactions in last 10 minutes
  const now = Date.now();
  const recentCount = history.filter(
    (t) => now - t.timestamp < 10 * 60 * 1000
  ).length;
  const transactionFrequency = recentCount >= 3;

  // F. Time anomaly — late night or early morning
  const hour = new Date().getHours();
  const unusualTime = hour < 6 || hour >= 22;

  // G. Scam pattern in UPI ID
  const scamPattern = hasScamPattern(input.receiverUpi);

  return {
    newBeneficiary,
    firstTransaction,
    receiverReported,
    receiverReputationRisk: rep.reputationRisk,
    amountAnomaly,
    transactionFrequency,
    unusualTime,
    scamPattern,
  };
}
