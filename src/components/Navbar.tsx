import { ShieldCheck, History, LayoutDashboard, CreditCard } from "lucide-react";

export type View = "pay" | "history" | "dashboard";

interface NavbarProps {
  current: View;
  onNavigate: (view: View) => void;
  txnCount: number;
}

const tabs: { id: View; label: string; icon: typeof ShieldCheck }[] = [
  { id: "pay", label: "Pay", icon: CreditCard },
  { id: "history", label: "History", icon: History },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Navbar({ current, onNavigate, txnCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={() => onNavigate("pay")}
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            Secure<span className="text-emerald-600">Pay</span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = current === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === "history" && txnCount > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 text-xs font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {txnCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
