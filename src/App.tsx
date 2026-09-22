import { useEffect, useState } from "react";
import { Navbar, type View } from "@/components/Navbar";
import { PayScreen } from "@/components/PayScreen";
import { AnalysisScreen } from "@/components/AnalysisScreen";
import { HistoryScreen } from "@/components/HistoryScreen";
import { DashboardScreen } from "@/components/DashboardScreen";
import type { PaymentInput, Transaction } from "@/lib/types";
import { loadTransactions, clearTransactions } from "@/lib/storage";

type Screen = { name: "form" } | { name: "analysis"; input: PaymentInput };

function App() {
  const [view, setView] = useState<View>("pay");
  const [screen, setScreen] = useState<Screen>({ name: "form" });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setTransactions(loadTransactions());
  }, []);

  function handlePay(input: PaymentInput) {
    setScreen({ name: "analysis", input });
  }

  function handleAnalysisDone() {
    setTransactions(loadTransactions());
    setScreen({ name: "form" });
  }

  function handleClear() {
    clearTransactions();
    setTransactions([]);
  }

  function navigate(v: View) {
    setView(v);
    if (v === "pay") setScreen({ name: "form" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar current={view} onNavigate={navigate} txnCount={transactions.length} />

      <main>
        {view === "pay" &&
          (screen.name === "form" ? (
            <PayScreen onPay={handlePay} />
          ) : (
            <AnalysisScreen
              input={screen.input}
              history={transactions}
              onDone={handleAnalysisDone}
            />
          ))}

        {view === "history" && (
          <HistoryScreen transactions={transactions} onClear={handleClear} />
        )}

        {view === "dashboard" && <DashboardScreen transactions={transactions} />}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">
          SecurePay — Simulated fraud detection prototype. No real payments, banks, or UPI
          infrastructure involved.
        </p>
      </footer>
    </div>
  );
}

export default App;
