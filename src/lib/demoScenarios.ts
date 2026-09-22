import type { DemoScenario } from "./types";

export const demoScenarios: DemoScenario[] = [
  {
    label: "Safe Transaction",
    description: "₹500 to a known friend",
    accent: "safe",
    data: {
      receiverUpi: "friend@upi",
      amount: 500,
      transactionType: "P2P",
      message: "Lunch split",
    },
  },
  {
    label: "Suspicious Transaction",
    description: "₹15,000 to a new contact",
    accent: "suspicious",
    data: {
      receiverUpi: "newperson@upi",
      amount: 15000,
      transactionType: "P2P",
      message: "",
    },
  },
  {
    label: "High-Risk Transaction",
    description: "₹50,000 to a reported receiver",
    accent: "critical",
    data: {
      receiverUpi: "scamdemo@upi",
      amount: 50000,
      transactionType: "P2P",
      message: "",
    },
  },
];
