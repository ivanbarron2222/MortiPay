import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bike,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { formatPhpCurrency } from "../../lib/financing";
import { getCurrentDemoUser, type DemoUserAccount } from "../../lib/demo-users";
import {
  getNextUserInstallment,
  getUserLoanProgress,
  getUserLoanSchedule,
  getUserLoanStatus,
} from "../../lib/user-loan";

type TimelineStatus = "paid" | "due" | "upcoming";

export function LoanDetails() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const [showAllInstallments, setShowAllInstallments] = useState(false);
  const [copied, setCopied] = useState(false);
  const loan = currentUser?.loanProfile ?? null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = await getCurrentDemoUser();
      if (active) setCurrentUser(user);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const loanProgress = useMemo(() => getUserLoanProgress(loan), [loan]);
  const loanStatus = useMemo(() => getUserLoanStatus(loan), [loan]);
  const nextInstallment = useMemo(() => getNextUserInstallment(loan), [loan]);
  const fullSchedule = useMemo(() => (loan ? getUserLoanSchedule(loan) : []), [loan]);

  const timelineItems = useMemo(() => {
    if (!loan) return [];

    return fullSchedule.map((item) => {
      let status: TimelineStatus = "upcoming";
      if (item.paid) {
        status = "paid";
      } else if (nextInstallment?.installmentNumber === item.installmentNumber) {
        status = "due";
      }

      return {
        ...item,
        status,
        label:
          status === "paid"
            ? "Paid"
            : status === "due"
              ? "Pending"
              : "Upcoming",
      };
    });
  }, [fullSchedule, loan, nextInstallment]);

  const visibleTimelineItems = showAllInstallments
    ? timelineItems
    : timelineItems.slice(
        Math.max((nextInstallment?.installmentNumber ?? 1) - 3, 0),
        Math.max((nextInstallment?.installmentNumber ?? 1) - 3, 0) + 5,
      );

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/user")}
              className="mr-4 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Loan Details</h1>
          </div>
        </div>
        <div className="px-6 py-6">
          <Card className="rounded-2xl p-6 text-center">
            <p className="mb-4 text-gray-700">
              No loan account assigned yet. Please contact admin.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const statusBadgeClassName =
    loanStatus.tone === "danger"
      ? "bg-red-100 text-red-700"
      : loanStatus.tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : loanStatus.tone === "success"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-blue-100 text-blue-700";

  const detailRows = [
    { label: "Loan Amount", value: formatPhpCurrency(loan.principalAmount) },
    { label: "Remaining Balance", value: formatPhpCurrency(loanProgress.remainingBalance), accent: true },
    { label: "Interest Rate", value: `${loan.annualInterestRate}% per annum` },
    { label: "Monthly Payment", value: formatPhpCurrency(loan.monthlyInstallment) },
    { label: "Start Date", value: loanProgress.startDateLabel },
    { label: "End Date", value: loanProgress.maturityDateLabel },
    { label: "Total Installments", value: `${loanProgress.totalMonths} months` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/user")}
            className="mr-4 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Loan Details</h1>
            <p className="text-sm text-slate-500">Your complete financing information</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <Card className="rounded-3xl border border-slate-200 p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your Vehicle</p>
              <h2 className="mt-2 text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                {loan.motorcycle}
              </h2>
              <p className="mt-1 break-all text-sm text-slate-500 sm:break-normal">
                {currentUser?.id ?? "-"} • Loan {loan.loanAccountNumber ?? "-"}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName}`}
            >
              {loanStatus.label}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Remaining Balance</p>
              <p className="mt-1 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {formatPhpCurrency(loanProgress.remainingBalance)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Monthly Payment</p>
              <p className="mt-1 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {formatPhpCurrency(loan.monthlyInstallment)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">Installment Progress</span>
              <span className="font-semibold text-blue-600">
                {loanProgress.progressPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={loanProgress.progressPercent} className="h-3 bg-slate-200" />
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>{loanProgress.paidMonths} paid</span>
              <span>{loanProgress.remainingMonths} remaining</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-3xl p-3 text-center shadow-sm sm:p-4">
            <p className="text-2xl font-bold text-slate-950 sm:text-3xl">
              {loanProgress.paidMonths}/{loanProgress.totalMonths}
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Installments Paid</p>
          </Card>
          <Card className="rounded-3xl p-3 text-center shadow-sm sm:p-4">
            <p className="text-2xl font-bold text-slate-950 sm:text-3xl">{loan.annualInterestRate}%</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Interest Rate</p>
          </Card>
          <Card className="rounded-3xl p-3 text-center shadow-sm sm:p-4">
            <p className="text-2xl font-bold text-slate-950 sm:text-3xl">{loanProgress.remainingMonths}</p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Months Left</p>
          </Card>
        </div>

        <Card className="rounded-3xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-950">Loan Details</h3>
              <p className="mt-1 text-sm text-slate-500">
                {loan.loanAccountNumber ?? "-"} • {loan.annualInterestRate}% p.a.
              </p>
            </div>
            <button
              onClick={() => setShowAllInstallments((value) => !value)}
              className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label={showAllInstallments ? "Collapse timeline" : "Expand timeline"}
            >
              {showAllInstallments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-200 border-t border-slate-200">
            {detailRows.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-4 py-4 ${
                  row.accent ? "rounded-2xl bg-blue-50 px-3" : ""
                }`}
              >
                <span className="text-slate-600">{row.label}</span>
                <span className={`text-right font-semibold ${row.accent ? "text-blue-600" : "text-slate-950"}`}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-4">
              <span className="text-slate-600">Loan Reference</span>
              <button
                onClick={async () => {
                  const value = loan.loanAccountNumber ?? "";
                  if (!value) return;
                  try {
                    await navigator.clipboard.writeText(value);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  } catch {
                    setCopied(false);
                  }
                }}
                className="inline-flex items-center gap-2 font-semibold text-slate-950"
              >
                {loan.loanAccountNumber ?? "-"}
                <Copy size={14} className="text-slate-500" />
              </button>
            </div>
          </div>

          {copied ? <p className="mt-2 text-xs text-emerald-600">Loan reference copied.</p> : null}

          <div className="mt-5 rounded-3xl bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vehicle</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
                <Bike size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-950">{loan.motorcycle}</p>
                <p className="text-sm text-slate-500">{currentUser?.fullName ?? "Assigned borrower"}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">Installment Timeline</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {loanProgress.paidMonths} of {loanProgress.totalMonths} installments paid
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Paid
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Due
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="space-y-4">
              {visibleTimelineItems.map((item, index) => (
                <div key={item.installmentNumber} className="flex gap-3">
                  <div className="flex w-7 flex-col items-center">
                    <div
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                        item.status === "paid"
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : item.status === "due"
                            ? "border-amber-500 bg-amber-500 text-black"
                            : "border-slate-300 bg-white text-slate-400"
                      }`}
                    >
                      {item.status === "paid" ? "✓" : item.status === "due" ? "" : ""}
                    </div>
                    {index < visibleTimelineItems.length - 1 ? (
                      <div className="mt-1 h-full min-h-8 w-px bg-slate-200" />
                    ) : null}
                  </div>

                  <div className="flex-1 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">
                          Installment #{item.installmentNumber}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.status === "paid"
                            ? `Paid on ${item.dueDateLabel}`
                            : `Due ${item.dueDateLabel}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-950">
                          {formatPhpCurrency(item.amount)}
                        </p>
                        <p
                          className={`text-sm ${
                            item.status === "paid"
                              ? "text-emerald-600"
                              : item.status === "due"
                                ? "text-amber-600"
                                : "text-slate-500"
                          }`}
                        >
                          {item.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {timelineItems.length > 5 ? (
              <button
                onClick={() => setShowAllInstallments((value) => !value)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                {showAllInstallments
                  ? `Show fewer installments`
                  : `View all ${timelineItems.length} installments`}
                {showAllInstallments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-slate-950">Need Help?</h3>
              <p className="mt-1 text-sm text-slate-500">
                Review reminders or contact support if you expect a payment delay.
              </p>
            </div>
            <CalendarClock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/user/reminders")}
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Review Reminders
            </Button>
            <Button
              onClick={() => navigate("/user/support")}
              variant="outline"
              className="rounded-xl border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            >
              Contact Support
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
