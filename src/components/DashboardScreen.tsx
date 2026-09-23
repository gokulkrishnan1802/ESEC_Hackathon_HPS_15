import React, { useMemo, useState } from "react";
import "./DashboardScreen.css";
import type { Transaction } from "@/lib/types";

type Props = {
  transactions?: Transaction[];
};


function DashboardScreen({ transactions = [] }: Props) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  const list = transactions;

  const stats = useMemo(() => {
    const totalAmount = list.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );

    const highRisk = list.filter(
      (item) => item.risk.risk_level === "HIGH"
    ).length;

    const critical = list.filter(
      (item) => item.risk.risk_level === "CRITICAL"
    ).length;

    const average =
      list.length > 0
        ? Math.round(
            list.reduce(
              (sum, item) => sum + item.risk.risk_score,
              0
            ) / list.length
          )
        : 0;

    return {
      totalAmount,
      highRisk,
      critical,
      average,
    };
  }, [list]);

  return (
    <div className="dashboard">

      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <div className="brand-row">
            <div className="brand-icon">🛡️</div>
            <div>
              <h1>Fraud Intelligence Center</h1>
              <p>
                UPI transaction monitoring and fraud detection dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="live-status">
          <span className="status-dot"></span>
          Monitoring Active
        </div>
      </header>

      {/* STATS */}
      <section className="stats-grid">

        <StatCard
          icon="💳"
          title="Total Transactions"
          value={list.length}
        />

        <StatCard
          icon="💰"
          title="Amount Analyzed"
          value={`₹${stats.totalAmount.toLocaleString("en-IN")}`}
        />


        <StatCard
          icon="🚨"
          title="Critical Alerts"
          value={stats.critical}
        />

        <StatCard
          icon="📊"
          title="Average Risk"
          value={`${stats.average}/100`}
        />

      </section>

      {/* ANALYTICS */}
      <section className="analytics-grid">

        {/* RISK DISTRIBUTION */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Risk Distribution</h2>
              <p>Transaction risk classification</p>
            </div>
            <span className="panel-icon">📈</span>
          </div>

          <RiskBar
            title="Low Risk"
            count={
              list.filter(
                (item) => item.risk.risk_score < 31
              ).length
            }
            total={list.length}
            type="low"
          />

          <RiskBar
            title="Medium Risk"
            count={
              list.filter(
                (item) =>
                  item.risk.risk_score >= 31 &&
                  item.risk.risk_score < 61
              ).length
            }
            total={list.length}
            type="medium"
          />

          <RiskBar
            title="Critical Risk"
            count={
              list.filter(
                (item) => item.risk.risk_score >= 61
              ).length
            }
            total={list.length}
            type="critical"
          />
        </div>

        {/* FRAUD INTELLIGENCE */}
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Fraud Intelligence</h2>
              <p>Detected suspicious patterns</p>
            </div>
            <span className="panel-icon">🔍</span>
          </div>

          <Pattern
            icon="👤"
            title="New Beneficiary"
            text="New receiver detected"
          />

          <Pattern
            icon="💸"
            title="Amount Anomaly"
            text="Unusual transaction amount"
          />

          <Pattern
            icon="⏱️"
            title="Unusual Time"
            text="Transaction at unusual time"
          />

          <Pattern
            icon="🔁"
            title="Rapid Transactions"
            text="Multiple payments detected"
          />

          <Pattern
            icon="🎯"
            title="Scam Pattern"
            text="Suspicious behaviour detected"
          />
        </div>

      </section>

      {/* TRANSACTION TABLE */}
      <section className="panel transaction-panel">

        <div className="section-header">
          <div>
            <h2>Live Risk Alerts</h2>
            <p>Recent UPI transaction activity</p>
          </div>

          <span className="alert-count">
            {stats.highRisk + stats.critical} Alerts
          </span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Receiver</th>
                <th>Amount</th>
                <th>Risk Score</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {list.map((transaction, index) => {
                const score = transaction.risk.risk_score;
                const level = transaction.risk.risk_level;

                return (
                  <tr key={transaction.id || index}>

                    <td className="sender-name">
                      {"You"}
                    </td>

                    <td className="receiver-name">
                      {transaction.receiverUpi}
                    </td>

                    <td>
                      ₹
                      {transaction.amount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      <strong className="score">
                        {score}/100
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`risk-badge ${level.toLowerCase()}`}
                      >
                        {level}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-text ${transaction.status?.toLowerCase()}`}
                      >
                        {transaction.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="investigate-btn"
                        onClick={() =>
                          setSelected(transaction)
                        }
                      >
                        Investigate
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* INVESTIGATION */}
      {selected && (
        <section className="panel investigation">

          <div className="section-header">
            <div>
              <h2>Transaction Investigation</h2>
              <p>Detailed fraud analysis</p>
            </div>

            <button
              className="close-btn"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          <div className="details-grid">

            <Info
              title="Sender"
              value="You"
            />

            <Info
              title="Receiver"
              value={selected.receiverUpi}
            />
            <Info
              title="Amount"
              value={`₹${(
                selected.amount || 0
              ).toLocaleString("en-IN")}`}
            />

            <Info
              title="Risk Score"
              value={`${selected.risk.risk_score}/100`}
            />

            <Info
              title="Risk Level"
              value={selected.risk.risk_level}
            />

            <Info
              title="Transaction Time"
              value={new Date(selected.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />

          </div>

          <div className="detection-summary">
            <h3>🔍 Detection Summary</h3>

            <p>
              The transaction was analyzed using amount behaviour,
              receiver information, transaction frequency and risk score.
            </p>

            <div className="detection-tags">
              <span>Amount Analysis</span>
              <span>Receiver Analysis</span>
              <span>Behaviour Analysis</span>
              <span>Risk Scoring</span>
            </div>
          </div>

        </section>
      )}

      {/* SYSTEM STATUS */}
      <section className="system-grid">

        <SystemStatus
          title="Fraud Detection Engine"
          status="ONLINE"
        />

        <SystemStatus
          title="Transaction Monitoring"
          status="ACTIVE"
        />

        <SystemStatus
          title="Risk Analysis"
          status="RUNNING"
        />

      </section>

    </div>
  );
}

/* STAT CARD */

function StatCard({
  icon,
  title,
  value,
}: {
  icon: string;
  title: string;
  value: string | number;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <p>{title}</p>

      <h2>{value}</h2>
    </div>
  );
}

/* RISK BAR */

function RiskBar({
  title,
  count,
  total,
  type,
}: {
  title: string;
  count: number;
  total: number;
  type: string;
}) {
  const percentage =
    total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="risk-row">

      <div className="risk-title">
        <span>{title}</span>
        <strong>{count}</strong>
      </div>

      <div className="risk-track">
        <div
          className={`risk-fill ${type}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

    </div>
  );
}

/* FRAUD PATTERN */

function Pattern({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="pattern">

      <div className="pattern-icon">
        {icon}
      </div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>

    </div>
  );
}

/* INFO */

function Info({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="info-box">
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}

/* SYSTEM STATUS */

function SystemStatus({
  title,
  status,
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="system-card">
      <p>{title}</p>
      <strong>
        <span className="system-dot"></span>
        {status}
      </strong>
    </div>
  );
}

export { DashboardScreen };
export default DashboardScreen;