import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search, FileText } from "lucide-react";
import {
  type DemoUserAccount,
  getDemoUsers,
  getLoanInstallmentSchedule,
  setDemoUserInstallmentPaid,
  setDemoUserLoanStartDate,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

export function AdminLoans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [usersWithLoans, setUsersWithLoans] = useState<DemoUserAccount[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const users = await getDemoUsers();
      if (active) {
        setUsersWithLoans(
          users.filter((user) => user.role === "user" && user.loanProfile),
        );
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = usersWithLoans.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.loanProfile?.motorcycle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleInstallmentStatusChange = async (
    userId: string,
    installmentNumber: number,
    paid: boolean,
  ) => {
    await setDemoUserInstallmentPaid(userId, installmentNumber, paid);
    const users = await getDemoUsers();
    setUsersWithLoans(users.filter((user) => user.role === "user" && user.loanProfile));
  };

  const handleSetAlertScenario = async (
    userId: string,
    paidInstallmentCount: number,
    daysOffset: number,
  ) => {
    const now = new Date();
    const targetDueDate = new Date(now);
    targetDueDate.setHours(0, 0, 0, 0);
    targetDueDate.setDate(targetDueDate.getDate() + daysOffset);

    const startDate = new Date(targetDueDate);
    startDate.setMonth(startDate.getMonth() - paidInstallmentCount);
    await setDemoUserLoanStartDate(userId, startDate.toISOString());
    const users = await getDemoUsers();
    setUsersWithLoans(users.filter((user) => user.role === "user" && user.loanProfile));
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Accounts</h1>
        <p className="text-gray-600">
          Admin can mark each installment month as paid for tracking.
        </p>
      </div>

      <Card className="p-6 rounded-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search by user, ID, or motorcycle..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map((user) => {
          if (!user.loanProfile) return null;
          const schedule = getLoanInstallmentSchedule(user.loanProfile);

          return (
            <Card key={user.id} className="p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.fullName}</h3>
                  <p className="text-sm text-gray-600">{user.id}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-xs text-gray-600">Motorcycle</p>
                  <p className="font-semibold text-gray-900">{user.loanProfile.motorcycle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Principal</p>
                  <p className="font-semibold text-gray-900">
                    {formatPhpCurrency(user.loanProfile.principalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Term</p>
                  <p className="font-semibold text-gray-900">
                    {user.loanProfile.termMonths} months
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Monthly Installment</p>
                  <p className="font-semibold text-blue-600">
                    {formatPhpCurrency(user.loanProfile.monthlyInstallment)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Installment Status
                </p>
                <div className="mb-3 rounded-md border bg-blue-50 p-2">
                  <p className="text-xs text-blue-800 mb-2 font-semibold">
                    Quick Reminder Scenario
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        handleSetAlertScenario(
                          user.id,
                          user.loanProfile?.paidInstallmentNumbers.length ?? 0,
                          7,
                        )
                      }
                      className="px-2 py-1 rounded bg-white border text-xs hover:bg-blue-100"
                    >
                      Due in 7 days
                    </button>
                    <button
                      onClick={() =>
                        handleSetAlertScenario(
                          user.id,
                          user.loanProfile?.paidInstallmentNumbers.length ?? 0,
                          3,
                        )
                      }
                      className="px-2 py-1 rounded bg-white border text-xs hover:bg-blue-100"
                    >
                      Due in 3 days
                    </button>
                    <button
                      onClick={() =>
                        handleSetAlertScenario(
                          user.id,
                          user.loanProfile?.paidInstallmentNumbers.length ?? 0,
                          0,
                        )
                      }
                      className="px-2 py-1 rounded bg-white border text-xs hover:bg-blue-100"
                    >
                      Due today
                    </button>
                    <button
                      onClick={() =>
                        handleSetAlertScenario(
                          user.id,
                          user.loanProfile?.paidInstallmentNumbers.length ?? 0,
                          -1,
                        )
                      }
                      className="px-2 py-1 rounded bg-white border text-xs hover:bg-blue-100"
                    >
                      Overdue by 1 day
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {schedule.map((item) => (
                    <div
                      key={`${user.id}-${item.installmentNumber}`}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          Month {item.installmentNumber} • {item.dueDate}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatPhpCurrency(item.amount)}
                        </p>
                      </div>
                      {item.paid ? (
                        <button
                          onClick={() =>
                            handleInstallmentStatusChange(
                              user.id,
                              item.installmentNumber,
                              false,
                            )
                          }
                          className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-700"
                        >
                          Paid
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleInstallmentStatusChange(
                              user.id,
                              item.installmentNumber,
                              true,
                            )
                          }
                          className="px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 rounded-xl text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={40} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No loans found</h3>
          <p className="text-gray-600">Create a user loan account first.</p>
        </Card>
      ) : null}
    </div>
  );
}
