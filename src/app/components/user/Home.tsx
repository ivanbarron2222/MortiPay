import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { LogOut, ChevronRight, Bike } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatPhpCurrency } from "../../lib/financing";
import { getCurrentDemoUser, logoutDemoUser, type DemoUserAccount } from "../../lib/demo-users";
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
  const loan = currentUser?.loanProfile ?? null;
  const [showAlertModal, setShowAlertModal] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = await getCurrentDemoUser();
      if (active) setCurrentUser(user);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const nextDueDate = useMemo(() => {
    if (!loan) return "-";
    const paidCount = loan.paidInstallmentNumbers.length;
    const dueDate = new Date(loan.startDate);
    dueDate.setMonth(dueDate.getMonth() + paidCount);
    return dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [loan]);

  const monthlyPayment = loan?.monthlyInstallment ?? 0;
  const paidCount = loan?.paidInstallmentNumbers.length ?? 0;
  const remainingBalance = loan
    ? Math.max(loan.totalPayable - paidCount * loan.monthlyInstallment, 0)
    : 0;

  const alertData = useMemo<HomeAlert | null>(() => {
    if (!loan) return null;
    if (paidCount >= loan.termMonths) return null;

    const dueDate = new Date(loan.startDate);
    dueDate.setHours(0, 0, 0, 0);
    dueDate.setMonth(dueDate.getMonth() + paidCount);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayMs = 24 * 60 * 60 * 1000;
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / dayMs);

    if (daysUntilDue === 7) {
      return {
        key: `due-7-${paidCount}`,
        title: "Payment Due in 7 Days",
        message: "Your next installment is due in 7 days.",
        tone: "info",
      };
    }
    if (daysUntilDue === 3) {
      return {
        key: `due-3-${paidCount}`,
        title: "Payment Due in 3 Days",
        message: "Your next installment is due in 3 days.",
        tone: "warning",
      };
    }
    if (daysUntilDue === 0) {
      return {
        key: `due-today-${paidCount}`,
        title: "Payment Due Today",
        message: "Your installment is due today.",
        tone: "warning",
      };
    }
    if (daysUntilDue < 0) {
      const overdueDays = Math.abs(daysUntilDue);
      const penalty = overdueDays * DAILY_OVERDUE_PENALTY;
      return {
        key: `overdue-${overdueDays}-${paidCount}`,
        title: "Installment Overdue",
        message: `Overdue by ${overdueDays} day(s). Penalty: ${formatPhpCurrency(
          penalty,
        )} (${formatPhpCurrency(DAILY_OVERDUE_PENALTY)}/day).`,
        tone: "warning",
      };
    }
    return null;
  }, [loan, paidCount]);

  useEffect(() => {
    if (!alertData || !currentUser) return;
    const storageKey = `mf_last_home_alert_${currentUser.id}`;
    const lastShown = window.sessionStorage.getItem(storageKey);
    if (lastShown === alertData.key) return;
    window.sessionStorage.setItem(storageKey, alertData.key);
    setShowAlertModal(true);
  }, [alertData, currentUser]);

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Morti Pay</h1>
          <button
            onClick={() => {
              logoutDemoUser();
              navigate("/");
            }}
            className="text-white hover:text-blue-100 p-2"
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

      <div className="px-6 -mt-4">
        <Card className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">Your Motorcycle</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {loan?.motorcycle ?? "No Loan Assigned Yet"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {loan ? "Loan account is active" : "Admin will assign your loan details"}
                </p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Next Payment Due</span>
                <span className="font-semibold text-blue-600">
                  {loan ? nextDueDate : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining Balance</span>
                <span className="text-lg font-bold text-gray-900">
                  {loan ? formatPhpCurrency(remainingBalance) : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Payment</span>
                <span className="font-semibold text-gray-900">
                  {loan ? formatPhpCurrency(monthlyPayment) : "-"}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/user/loan-details")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
          >
            View Installment Breakdown
          </Button>
        </Card>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate("/user/catalog")}
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
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
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
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
