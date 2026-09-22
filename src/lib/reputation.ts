/** Fictional demo receiver reputation database — not real data. */

export interface ReceiverReputation {
  upi: string;
  reports: number;
  reputationRisk: "none" | "low" | "medium" | "high";
}

const reputationDB: Record<string, ReceiverReputation> = {
  "friend@upi": { upi: "friend@upi", reports: 0, reputationRisk: "none" },
  "newperson@upi": { upi: "newperson@upi", reports: 0, reputationRisk: "none" },
  "scamdemo@upi": { upi: "scamdemo@upi", reports: 7, reputationRisk: "high" },
  "merchant@upi": { upi: "merchant@upi", reports: 0, reputationRisk: "none" },
  "shop@upi": { upi: "shop@upi", reports: 1, reputationRisk: "low" },
  "fakestore@upi": { upi: "fakestore@upi", reports: 5, reputationRisk: "high" },
  "unknown@upi": { upi: "unknown@upi", reports: 0, reputationRisk: "none" },
};

const scamKeywords = ["scam", "fraud", "fake", "demo", "test", "lottery", "prize"];

export function getReputation(upi: string): ReceiverReputation {
  const key = upi.toLowerCase().trim();
  if (reputationDB[key]) return reputationDB[key];
  return { upi: key, reports: 0, reputationRisk: "none" };
}

export function hasScamPattern(upi: string): boolean {
  const lower = upi.toLowerCase();
  return scamKeywords.some((kw) => lower.includes(kw));
}
