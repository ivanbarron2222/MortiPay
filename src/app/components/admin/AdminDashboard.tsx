import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Users, FileText, CreditCard } from "lucide-react";
import { getDemoUsers, type DemoUserAccount } from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

export function AdminDashboard() {
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = await getDemoUsers();
      if (active) setUsers(next.filter((user) => user.role === "user"));
    };
    load();
    return () => {
      active = false;
    };
  }, []);
  const withLoans = users.filter((user) => user.loanProfile);
  const totalReceivable = withLoans.reduce(
    (sum, user) => sum + (user.loanProfile?.totalPayable ?? 0),
    0,
  );

  const stats = [
    {
      title: "Total User Accounts",
      value: String(users.length),
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Loan Accounts Created",
      value: String(withLoans.length),
      icon: FileText,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Receivable",
      value: formatPhpCurrency(totalReceivable),
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Admin-managed account creation with automatic installment breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Loan Accounts</h2>
        <div className="space-y-3">
          {withLoans.slice(0, 5).map((user) => (
            <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">
                {user.loanProfile?.motorcycle} • {user.loanProfile?.termMonths} months
              </p>
              <p className="text-sm text-gray-900 mt-1">
                Monthly: {formatPhpCurrency(user.loanProfile?.monthlyInstallment ?? 0)}
              </p>
            </div>
          ))}
          {withLoans.length === 0 ? (
            <p className="text-sm text-gray-600">No loan accounts yet.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
