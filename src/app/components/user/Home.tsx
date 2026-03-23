import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  LogOut,
  ChevronRight,
  Bike,
  CalendarClock,
  CircleAlert,
  CircleCheckBig,
  Wallet,
  Clock3,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { formatPhpCurrency } from "../../lib/financing";
import { getCurrentDemoUser, logoutDemoUser, type DemoUserAccount } from "../../lib/demo-users";
import {
  getNextUserInstallment,
  getRecentUserPayments,
  getUserLoanProgress,
  getUserReminderTrigger,
  getUserLoanStatus,
} from "../../lib/user-loan";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const DAILY_OVERDUE_PENALTY = 50;

type HomeAlert = {
  key: string;
  title: string;
  message: string;
  tone: "info" | "warning";
};

export function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
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

  const nextInstallment = useMemo(() => getNextUserInstallment(loan), [loan]);
  const loanProgress = useMemo(() => getUserLoanProgress(loan), [loan]);
  const loanStatus = useMemo(() => getUserLoanStatus(loan), [loan]);
  const reminderTrigger = useMemo(() => getUserReminderTrigger(loan), [loan]);
  const recentPayments = useMemo(() => getRecentUserPayments(loan, 2), [loan]);

  const alertData = useMemo<HomeAlert | null>(() => {
    if (!loan || !nextInstallment || !reminderTrigger) return null;

    if (reminderTrigger.kind === "overdue") {
      const penalty = nextInstallment.overdueDays * DAILY_OVERDUE_PENALTY;
      return {
        key: `overdue-${nextInstallment.overdueDays}-${nextInstallment.installmentNumber}`,
        title: reminderTrigger.title,
        message: `Overdue by ${nextInstallment.overdueDays} day(s). Penalty: ${formatPhpCurrency(
          penalty,
        )} (${formatPhpCurrency(DAILY_OVERDUE_PENALTY)}/day).`,
        tone: "warning",
      };
    }

    return {
      key: `${reminderTrigger.kind}-${nextInstallment.installmentNumber}-${nextInstallment.daysUntilDue}`,
      title: reminderTrigger.title,
      message: reminderTrigger.message,
      tone: reminderTrigger.tone,
    };
  }, [loan, nextInstallment, reminderTrigger]);

  useEffect(() => {
    if (!alertData || !currentUser) return;
    const storageKey = `mf_last_home_alert_${currentUser.id}`;
    const lastShown = window.sessionStorage.getItem(storageKey);
    if (lastShown === alertData.key) return;
    window.sessionStorage.setItem(storageKey, alertData.key);
    setShowAlertModal(true);
  }, [alertData, currentUser]);

  const statusBadgeClassName =
    loanStatus.tone === "danger"
      ? "bg-red-100 text-red-700"
      : loanStatus.tone === "warning"
        ? "bg-amber-100 text-amber-700"
        : loanStatus.tone === "success"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-blue-100 text-blue-700";

  const dueCardClassName =
    loanStatus.tone === "danger"
      ? "border-red-200 bg-red-500 text-white"
      : loanStatus.tone === "warning"
        ? "border-amber-300 bg-amber-500 text-slate-950"
        : "border-blue-200 bg-blue-600 text-white";

  const dueCardMutedClassName =
    loanStatus.tone === "danger"
      ? "text-red-100"
      : loanStatus.tone === "warning"
        ? "text-amber-950/80"
        : "text-blue-100";

  const dueCardButtonClassName =
    loanStatus.tone === "warning"
      ? "bg-slate-950 hover:bg-black text-white"
      : "bg-white/15 hover:bg-white/20 text-white border border-white/20";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 pb-6">
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{alertData?.title ?? "Installment Alert"}</DialogTitle>
            <DialogDescription>In-app notification</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700">{alertData?.message}</p>
          <DialogFooter>
            {alertData?.tone === "warning" ? (
              <Button
                onClick={() => {
                  setShowAlertModal(false);
                  navigate("/user/reminders");
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Open Reminders
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setShowAlertModal(false);
                  navigate("/user/loan-details");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Open Loan Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-blue-600 px-6 pt-6 pb-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Morti Pay</h1>
          <button
            onClick={() => {
              logoutDemoUser();
              navigate("/");
            }}
            className="p-2 text-white hover:text-blue-100"
          >
            <LogOut size={22} />
          </button>
        </div>

        <div className="text-white">
          <p className="text-blue-100">Welcome back,</p>
          <h2 className="text-xl font-semibold">
            {currentUser?.fullName ?? "Guest User"}
          </h2>
        </div>
      </div>

      <div className="space-y-4 px-4 -mt-4 sm:px-6">
        <Card className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Your Vehicle</p>
              <h3 className="mt-2 text-xl font-bold leading-tight text-slate-950 sm:text-2xl">
                {loan?.motorcycle ?? "No Loan Assigned Yet"}
              </h3>
              <p className="mt-1 break-all text-sm text-slate-500 sm:break-normal">
                {currentUser?.id ?? "-"} • Loan {loan?.loanAccountNumber ?? "-"}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName}`}
            >
              {loanStatus.label}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Remaining Balance</p>
              <p className="mt-1 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {loan ? formatPhpCurrency(loanProgress.remainingBalance) : "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Monthly Payment</p>
              <p className="mt-1 break-words text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {loan ? formatPhpCurrency(loan.monthlyInstallment) : "-"}
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

        <Card className={`rounded-3xl border p-4 shadow-sm sm:p-5 ${dueCardClassName}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em]">
                {loanStatus.label === "Current" ? "Next Payment" : loanStatus.label}
              </p>
              <h3 className="mt-2 text-3xl font-bold">
                {loan && nextInstallment ? formatPhpCurrency(nextInstallment.amount) : "-"}
              </h3>
              <p className={`mt-2 text-sm ${dueCardMutedClassName}`}>
                {loan && nextInstallment
                  ? `Due ${nextInstallment.dueDateLabel}`
                  : "Admin will assign your first installment schedule."}
              </p>
              <p className={`mt-1 text-sm ${dueCardMutedClassName}`}>
                {loan && nextInstallment
                  ? nextInstallment.overdueDays > 0
                    ? `${nextInstallment.overdueDays} day(s) overdue`
                    : nextInstallment.daysUntilDue === 0
                      ? "Due today"
                      : `In ${nextInstallment.daysUntilDue} day(s)`
                  : loanStatus.message}
              </p>
            </div>
            <Clock3 className="h-6 w-6 shrink-0" />
          </div>

          <Button
            onClick={() => navigate("/user/loan-details")}
            className={`mt-5 w-full rounded-2xl py-6 text-base ${dueCardButtonClassName}`}
          >
            View Installment Breakdown
          </Button>
        </Card>

        <Card className="rounded-3xl p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Recent Payment Activity</p>
              <h3 className="text-lg font-bold text-slate-900">Latest updates</h3>
            </div>
            <button
              onClick={() => navigate("/user/loan-details")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View full history
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map((payment) => (
                <div
                  key={`${payment.installmentNumber}-${payment.dueDateLabel}`}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      Installment {payment.installmentNumber}
                    </p>
                    <p className="text-sm text-slate-500">Paid on {payment.dueDateLabel}</p>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {formatPhpCurrency(payment.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No payment history yet. Your first completed installment will appear here.
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/user/catalog")}
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Bike className="text-blue-600" size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Browse Catalog</p>
                <p className="text-xs text-gray-600">Find motorcycles to loan</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </button>

          <button
            onClick={() => navigate("/user/loan-details")}
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-5 w-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Loan Details</p>
                <p className="text-xs text-gray-600">View installment breakdown</p>
              </div>
            </div>
            <ChevronRight className="text-gray-400" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
