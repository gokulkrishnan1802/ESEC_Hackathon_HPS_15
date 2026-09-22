import type {
  PaymentInput,
  FraudSignals,
  RiskLevel,
  RiskReason,
  RiskResult,
  Transaction,
} from "./types";

import { getReputation, hasScamPattern } from "./reputation";

export interface AnalysisContext {
  history: Transaction[];
}

/**
 * Modular fraud risk engine — rule-based prototype.
 *
 * Important:
 * This is a prototype risk assessment engine.
 * A high score does NOT prove that a transaction is fraud.
 *
 * The engine can later be replaced or extended with:
 * - Backend fraud detection
 * - Machine learning
 * - Behavioral analysis
 * - Real-time reputation intelligence
 */

export function analyzeTransaction(
  input: PaymentInput,
  ctx: AnalysisContext
): RiskResult {
  const signals = deriveSignals(input, ctx);

  const reasons: RiskReason[] = [];

  /*
   * -------------------------------------------------------
   * 1. NEW BENEFICIARY
   * -------------------------------------------------------
   *
   * New beneficiary and first transaction represent the
   * same underlying event, so we score it only once.
   */

  if (signals.newBeneficiary) {
    reasons.push({
      label: "You have not paid this receiver before",
      weight: 15,
      severity: "medium",
    });
  }

  /*
   * firstTransaction remains available inside signals
   * for the dashboard/future ML model, but it is NOT
   * scored separately.
   */

  /*
   * -------------------------------------------------------
   * 2. AMOUNT ANOMALY
   * -------------------------------------------------------
   */

  if (signals.amountAnomaly) {
    reasons.push({
      label:
        "Amount is significantly higher than your usual transaction pattern",
      weight: 20,
      severity: "high",
    });
  }

  /*
   * -------------------------------------------------------
   * 3. UNUSUAL TIME
   * -------------------------------------------------------
   */

  if (signals.unusualTime) {
    reasons.push({
      label: "Unusual transaction time",
      weight: 10,
      severity: "medium",
    });
  }

  /*
   * -------------------------------------------------------
   * 4. RECEIVER REPUTATION
   * -------------------------------------------------------
   *
   * Use reputation severity rather than giving every
   * reported receiver the same score.
   */

  if (signals.receiverReported) {
    if (signals.receiverReputationRisk === "high") {
      reasons.push({
        label:
          "Receiver has significant prior reports in the demo reputation database",
        weight: 30,
        severity: "critical",
      });
    } else if (signals.receiverReputationRisk === "medium") {
      reasons.push({
        label:
          "Receiver has elevated risk indicators in the demo reputation database",
        weight: 15,
        severity: "high",
      });
    } else {
      reasons.push({
        label:
          "Receiver has prior reports in the demo reputation database",
        weight: 5,
        severity: "medium",
      });
    }
  }

  /*
   * -------------------------------------------------------
   * 5. SCAM PATTERN
   * -------------------------------------------------------
   */

  if (signals.scamPattern) {
    reasons.push({
      label: "Receiver ID matches suspicious patterns",
      weight: 15,
      severity: "high",
    });
  }

  /*
   * -------------------------------------------------------
   * 6. RAPID TRANSACTIONS
   * -------------------------------------------------------
   */

  if (signals.transactionFrequency) {
    reasons.push({
      label: "Multiple rapid transactions detected",
      weight: 10,
      severity: "medium",
    });
  }

  /*
   * -------------------------------------------------------
   * 7. HIGH TRANSACTION VALUE
   * -------------------------------------------------------
   *
   * Additional signal for very large prototype payments.
   */

  if (input.amount >= 50000) {
    reasons.push({
      label: "Transaction value is unusually high",
      weight: 10,
      severity: "high",
    });
  }

  /*
   * -------------------------------------------------------
   * FINAL SCORE
   * -------------------------------------------------------
   */

  const rawScore = reasons.reduce(
    (sum, reason) => sum + reason.weight,
    0
  );

  const risk_score = Math.min(rawScore, 100);

  /*
   * -------------------------------------------------------
   * RISK CLASSIFICATION
   * -------------------------------------------------------
   */

  const risk_level: RiskLevel =
    risk_score >= 81
      ? "CRITICAL"
      : risk_score >= 61
      ? "HIGH"
      : risk_score >= 31
      ? "MEDIUM"
      : "LOW";

  /*
   * -------------------------------------------------------
   * DECISION
   * -------------------------------------------------------
   *
   * This is a warning system, not a definitive fraud
   * verdict.
   */

  const decision = risk_level === "LOW" ? "ALLOW" : "WARN";

  return {
    risk_score,
    risk_level,
    decision,
    reasons,
    signals,
  };
}

/*
 * =======================================================
 * SIGNAL DERIVATION
 * =======================================================
 */

function deriveSignals(
  input: PaymentInput,
  ctx: AnalysisContext
): FraudSignals {
  const receiver = input.receiverUpi.toLowerCase().trim();

  const history = ctx.history;

  /*
   * -------------------------------------------------------
   * A. BENEFICIARY HISTORY
   * -------------------------------------------------------
   *
   * Only completed/user-confirmed payments count as
   * evidence that the user has previously paid the receiver.
   */

  const priorToReceiver = history.filter(
    (transaction) =>
      transaction.receiverUpi.toLowerCase().trim() === receiver &&
      (transaction.status === "COMPLETED" ||
        transaction.status === "USER_CONFIRMED")
  );

  const newBeneficiary = priorToReceiver.length === 0;

  /*
   * First transaction is retained as an informational
   * signal but does not receive separate risk points.
   */

  const firstTransaction = priorToReceiver.length === 0;

  /*
   * -------------------------------------------------------
   * B. RECEIVER REPUTATION
   * -------------------------------------------------------
   */

  const reputation = getReputation(input.receiverUpi);

  const receiverReported = reputation.reports > 0;

  /*
   * -------------------------------------------------------
   * C. AMOUNT ANOMALY
   * -------------------------------------------------------
   *
   * Compare against the user's completed transaction
   * history.
   */

  const completedAmounts = history
    .filter(
      (transaction) =>
        transaction.status === "COMPLETED" ||
        transaction.status === "USER_CONFIRMED"
    )
    .map((transaction) => transaction.amount);

  const avgAmount =
    completedAmounts.length > 0
      ? completedAmounts.reduce((a, b) => a + b, 0) /
        completedAmounts.length
      : 2000;

  const amountAnomaly =
    input.amount > avgAmount * 3 && input.amount >= 5000;

  /*
   * -------------------------------------------------------
   * D. TRANSACTION FREQUENCY
   * -------------------------------------------------------
   *
   * 3 or more previous transactions within 10 minutes.
   */

  const now = Date.now();

  const recentCount = history.filter(
    (transaction) =>
      now - transaction.timestamp < 10 * 60 * 1000
  ).length;

  const transactionFrequency = recentCount >= 3;

  /*
   * -------------------------------------------------------
   * E. TIME ANOMALY
   * -------------------------------------------------------
   *
   * Prototype rule:
   * Before 6 AM or after 10 PM.
   */

  const hour = new Date().getHours();

  const unusualTime = hour < 6 || hour >= 22;

  /*
   * -------------------------------------------------------
   * F. SCAM PATTERN
   * -------------------------------------------------------
   */

  const scamPattern = hasScamPattern(input.receiverUpi);

  /*
   * -------------------------------------------------------
   * RETURN ALL SIGNALS
   * -------------------------------------------------------
   */

  return {
    newBeneficiary,
    firstTransaction,

    receiverReported,

    receiverReputationRisk:
      reputation.reputationRisk,

    amountAnomaly,

    transactionFrequency,

    unusualTime,

    scamPattern,
  };
}