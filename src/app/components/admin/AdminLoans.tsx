import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search, FileText, Lock } from "lucide-react";
import {
  type DemoUserAccount,
  getDemoUsers,
  getLoanInstallmentSchedule,
  setDemoUserInstallmentPaid,
  setDemoUserLoanStartDate,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";
import { getCurrentTenantSummary, type TenantSummary } from "../../lib/platform";
import { getOverdueSettings, type OverdueSettings } from "../../lib/tenant-config";

export function AdminLoans() {
  const [searchTerm, setSearchTerm] = useState("");
  const [usersWithLoans, setUsersWithLoans] = useState<DemoUserAccount[]>([]);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [overdueSettings, setOverdueSettings] = useState<OverdueSettings>(
    getOverdueSettings(),
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [users, nextTenant] = await Promise.all([
        getDemoUsers(),
        getCurrentTenantSummary(),
      ]);
      if (active) {
        setUsersWithLoans(
          users.filter((user) => user.role === "tenant_user" && user.loanProfile),
        );
        setTenant(nextTenant);
        setOverdueSettings(getOverdueSettings());
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
  const isPremium = tenant?.plan === "premium";

  const handleInstallmentStatusChange = async (
    userId: string,
    installmentNumber: number,
    paid: boolean,
  ) => {
    await setDemoUserInstallmentPaid(userId, installmentNumber, paid);
    const users = await getDemoUsers();
    setUsersWithLoans(
      users.filter((user) => user.role === "tenant_user" && user.loanProfile),
    );
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
    setUsersWithLoans(
      users.filter((user) => user.role === "tenant_user" && user.loanProfile),
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Accounts</h1>
        <p className="text-gray-600">
          Admin can mark installments as paid. Overdue rules automatically add fees to each
          missed month.
        </p>
      </div>

      <Card className="rounded-xl border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-blue-950">Overdue Rules Active</h2>
            <p className="mt-1 text-sm text-blue-800">
              Grace period: {overdueSettings.gracePeriodDays} day
              {overdueSettings.gracePeriodDays === 1 ? "" : "s"} | Fee:{" "}
              {overdueSettings.feeType === "percentage"
                ? `${overdueSettings.feeAmount}%`
                : formatPhpCurrency(overdueSettings.feeAmount)}
              {overdueSettings.feeType === "daily" ? " per overdue day" : ""}
            </p>
          </div>
          <button
            onClick={() => window.location.assign("/admin/settings")}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            Edit Settings
          </button>
        </div>
      </Card>

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
                {isPremium ? (
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
                ) : (
                  <div className="mb-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                      <Lock size={12} />
                      Premium Only
                    </div>
                    Quick reminder scenarios and overdue simulation controls are available only
                    for premium tenants.
                  </div>
                )}
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {schedule.map((item) => (
                    <div
                      key={`${user.id}-${item.installmentNumber}`}
                      className={`flex items-center justify-between rounded-md border p-2 ${
                        item.overdue ? "border-red-200 bg-red-50" : ""
                      }`}
                    >
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          Month {item.installmentNumber} • {item.dueDate}
                        </p>
                        <p className="text-xs text-gray-600">
                          Installment: {formatPhpCurrency(item.amount)}
                          {item.overdue ? (
                            <>
                              {" "}
                              | Overdue fee: {formatPhpCurrency(item.overdueFee)} | Total due:{" "}
                              {formatPhpCurrency(item.totalDue)}
                            </>
                          ) : null}
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
                        <div className="flex items-center gap-2">
                          {item.overdue ? (
                            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                              {item.daysOverdue}d overdue
                            </span>
                          ) : null}
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
                        </div>
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
