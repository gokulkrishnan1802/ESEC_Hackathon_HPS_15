#  SecurePay — UPI Fraud Alert System

A real-time UPI fraud risk detection and prevention system that analyzes transactions before payment completion and warns users about potentially suspicious transactions.

##  The Problem & Solution

### Problem

UPI payments are fast and convenient, but users can be exposed to scams such as fake payment requests, impersonation, suspicious beneficiaries, and unusually large transactions.

Many users realize that a transaction is suspicious only after the payment has already been completed.

### Solution

SecurePay acts as a fraud-risk detection layer between the payment request and payment completion.

It analyzes transaction details and internal risk signals such as receiver history, transaction patterns, unusual amounts, and receiver reputation to generate a risk score.

Before completing a potentially suspicious payment, SecurePay provides the user with an understandable warning and allows them to cancel or proceed with the transaction.

> **Note:** This project is a sandboxed prototype and does not process real UPI transactions or real money.

##  Features

-  **Pre-Payment Fraud Detection**  
  Analyzes transactions before they are completed.

-  **Risk Score & Risk Level**  
  Generates an explainable risk score from 0–100 and classifies transactions as Low, Medium, High, or Critical risk.

-  **Automatic Risk Analysis**  
  Internal signals such as new beneficiary status, receiver reputation, unusual transaction amount, transaction frequency, and suspicious patterns are calculated automatically.

-  **Explainable Fraud Alerts**  
  Shows users why a transaction has been flagged instead of simply displaying a risk score.

-  **Payment Prevention**  
  Users can cancel a suspicious transaction before completing the mock payment.

-  **Mock UPI Payment Flow**  
  Demonstrates the complete payment → analysis → warning → decision workflow without processing real money.

-  **Transaction History**  
  Stores analyzed transactions along with their risk scores, risk levels, and final status.

-  **Fraud Monitoring Dashboard**  
  Displays transaction statistics, risk distribution, and recent alerts.

-  **Quick Demo Scenarios**  
  Includes safe, suspicious, and high-risk scenarios for quick demonstrations.

-  **Local Persistence**  
  Prototype transaction data is stored using browser localStorage.

##  How It Works

```text
User enters payment details
          ↓
     Pay Now
          ↓
 Transaction Analysis
          ↓
 ┌───────────────────────────────┐
 │ Receiver History              │
 │ Receiver Reputation           │
 │ Amount Anomaly                │
 │ Transaction Frequency         │
 │ Time Pattern                  │
 │ Suspicious Pattern Detection  │
 └───────────────────────────────┘
          ↓
     Fraud Risk Engine
          ↓
    Risk Score + Reasons
          ↓
 ┌───────────────────────────────┐
 │ LOW / MEDIUM / HIGH / CRITICAL│
 └───────────────────────────────┘
          ↓
     User Warning
       ↙       ↘
   Cancel     Proceed
      ↓          ↓
   Blocked    Mock Payment
          ↓
    Transaction History
