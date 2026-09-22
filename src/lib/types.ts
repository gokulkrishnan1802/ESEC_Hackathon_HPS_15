export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Decision = "ALLOW" | "WARN" | "BLOCK";

export type TransactionType = "P2P" | "Merchant";

export type TransactionStatus =
  | "COMPLETED"
  | "USER_CONFIRMED"
  | "CANCELLED"
  | "BLOCKED";

/** Only user-facing fields — no manual fraud toggles */
export interface PaymentInput {
  receiverUpi: string;
  amount: number;
  transactionType: TransactionType;
  message?: string;
}

/** Internal fraud signals auto-derived by the engine */
export interface FraudSignals {
  newBeneficiary: boolean;
  firstTransaction: boolean;
  receiverReported: boolean;
  receiverReputationRisk: "none" | "low" | "medium" | "high";
  amountAnomaly: boolean;
  transactionFrequency: boolean;
  unusualTime: boolean;
  scamPattern: boolean;
}

export interface RiskReason {
  label: string;
  weight: number;
  severity: "low" | "medium" | "high" | "critical";
}

export interface RiskResult {
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  reasons: RiskReason[];
  signals: FraudSignals;
}

export interface Transaction extends PaymentInput {
  id: string;
  timestamp: number;
  risk: RiskResult;
  status: TransactionStatus;
}

export interface DemoScenario {
  label: string;
  description: string;
  accent: "safe" | "suspicious" | "critical";
  data: PaymentInput;
}
