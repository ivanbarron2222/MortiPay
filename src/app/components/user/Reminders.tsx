import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { getCurrentDemoUser, type DemoUserAccount } from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

type ReminderNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: "info" | "warning" | "success";
};

const DAILY_OVERDUE_PENALTY = 50;

export function Reminders() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const loan = currentUser?.loanProfile ?? null;
  const [selectedNotification, setSelectedNotification] =
    useState<ReminderNotification | null>(null);

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

  const nextInstallment = useMemo(() => {
    if (!loan) return null;
    const paidSet = new Set(loan.paidInstallmentNumbers ?? []);
    const nextNumber = Array.from({ length: loan.termMonths }, (_, i) => i + 1).find(
      (number) => !paidSet.has(number),
    );
    if (!nextNumber) return null;
    const dueDate = new Date(loan.startDate);
    dueDate.setHours(0, 0, 0, 0);
    dueDate.setMonth(dueDate.getMonth() + (nextNumber - 1));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / dayMs);
    const overdueDays = Math.max(-daysUntilDue, 0);
    return { nextNumber, dueDate, daysUntilDue, overdueDays };
  }, [loan]);

  const reminderNotifications = useMemo(() => {
    const list: ReminderNotification[] = [];

    if (!loan || !nextInstallment) {
      list.push({
        id: "no-loan",
        title: "No Active Loan Reminder",
        message: "No due installment found yet. Admin will assign your loan schedule.",
        time: "Today",
        tone: "info",
      });
      return list;
    }

    const dueDateLabel = nextInstallment.dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    if (nextInstallment.daysUntilDue === 7) {
      list.push({
        id: "due-7-days",
        title: "Payment Due in 7 Days",
        message: `Installment ${nextInstallment.nextNumber} is due in 7 days (${dueDateLabel}).`,
        time: "Today, 9:00 AM",
        tone: "info",
      });
    }

    if (nextInstallment.daysUntilDue === 3) {
      list.push({
        id: "due-3-days",
        title: "Payment Due in 3 Days",
        message: `Installment ${nextInstallment.nextNumber} is due in 3 days (${dueDateLabel}).`,
        time: "Today, 9:00 AM",
        tone: "warning",
      });
    }

    if (nextInstallment.daysUntilDue === 0) {
      list.push({
        id: "due-today",
        title: "Payment Due Today",
        message: `Installment ${nextInstallment.nextNumber} is due today.`,
        time: "Today, 9:00 AM",
        tone: "warning",
      });
    }

    if (nextInstallment.daysUntilDue < 0) {
      const penalty = nextInstallment.overdueDays * DAILY_OVERDUE_PENALTY;
      list.push({
        id: "overdue-alert",
        title: "Installment Overdue",
        message: `Overdue by ${nextInstallment.overdueDays} day(s). Penalty is ${formatPhpCurrency(
          penalty,
        )} (${formatPhpCurrency(DAILY_OVERDUE_PENALTY)}/day).`,
        time: "Today, 9:00 AM",
        tone: "warning",
      });
    }

    if (list.length === 0) {
      list.push({
        id: "no-trigger",
        title: "No Reminder Trigger Today",
        message:
          "Alerts are automatically triggered at 7 days, 3 days, due today, and overdue.",
        time: "Today, 9:00 AM",
        tone: "info",
      });
    }

    return list;
  }, [loan, nextInstallment]);

  const paidCount = loan?.paidInstallmentNumbers.length ?? 0;
  const primaryAlert = reminderNotifications[0] ?? null;

  useEffect(() => {
    if (!primaryAlert) return;
    const userId = currentUser?.id ?? "guest";
    const storageKey = `mf_last_reminder_alert_${userId}`;
    const alertKey = primaryAlert.id;
    const lastShown = window.sessionStorage.getItem(storageKey);
    if (lastShown === alertKey) return;
    const shouldAutoOpen =
      primaryAlert.id !== "no-trigger" && primaryAlert.id !== "no-loan";
    if (shouldAutoOpen) {
      window.sessionStorage.setItem(storageKey, alertKey);
      setSelectedNotification(primaryAlert);
    }
  }, [primaryAlert, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/user")}
              className="mr-4 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Reminders</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open recent notifications"
                className="relative rounded-full p-1 text-blue-600 hover:bg-blue-50"
              >
                <Bell size={24} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {reminderNotifications.length}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>In-App Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {reminderNotifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer items-start"
                  onSelect={() => setSelectedNotification(notification)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-xs text-gray-600">{notification.time}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog
        open={selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedNotification(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>{selectedNotification?.time}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-700">{selectedNotification?.message}</p>
          <DialogFooter>
            {selectedNotification?.tone === "warning" ? (
              <Button
                onClick={() => {
                  setSelectedNotification(null);
                  navigate("/user/support");
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Contact Support
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSelectedNotification(null);
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

      <div className="px-6 py-6 space-y-4">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 mb-1">Next Installment Due</p>
              <h2 className="text-3xl font-bold">
                {nextInstallment
                  ? nextInstallment.dueDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "-"}
              </h2>
            </div>
            <Calendar className="text-blue-200" size={32} />
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-sm">
              {nextInstallment ? (
                nextInstallment.daysUntilDue >= 0 ? (
                  <>
                    <span className="font-semibold">{nextInstallment.daysUntilDue} day(s)</span>{" "}
                    remaining for installment {nextInstallment.nextNumber}
                  </>
                ) : (
                  <>
                    Overdue by{" "}
                    <span className="font-semibold">
                      {nextInstallment.overdueDays} day(s)
                    </span>
                  </>
                )
              ) : (
                "No active installment found."
              )}
            </p>
          </div>
        </Card>

        {nextInstallment && nextInstallment.overdueDays > 0 ? (
          <Card className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                <AlertCircle className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">Overdue Penalty Running</h3>
                <p className="text-sm text-red-800 mb-3">
                  Installment {nextInstallment.nextNumber} is overdue by{" "}
                  {nextInstallment.overdueDays} day(s). Current penalty:{" "}
                  <span className="font-semibold">
                    {formatPhpCurrency(
                      nextInstallment.overdueDays * DAILY_OVERDUE_PENALTY,
                    )}
                  </span>{" "}
                  ({formatPhpCurrency(DAILY_OVERDUE_PENALTY)} per day).
                </p>
                <Button
                  onClick={() => navigate("/user/support")}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="rounded-2xl p-4 bg-green-50 border-green-100">
          <p className="text-sm text-green-800">
            Paid Installments: <span className="font-semibold">{paidCount}</span> /{" "}
            {loan?.termMonths ?? 0}
          </p>
        </Card>

        <Card className="rounded-xl p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-900">Alert Modal</p>
              <p className="text-xs text-amber-800">
                Tap to open the current in-app reminder as a modal alert.
              </p>
            </div>
            <Button
              onClick={() => {
                if (primaryAlert) setSelectedNotification(primaryAlert);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
            >
              Show Alert
            </Button>
          </div>
        </Card>

        <Card className="rounded-xl p-4 bg-blue-50 border-blue-100">
          <p className="text-sm text-blue-800">
            Alerts are automatic by default: 7 days before, 3 days before, due
            today, and overdue with daily penalty.
          </p>
        </Card>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Recent In-App Alerts</h3>
          <div className="space-y-3">
            {reminderNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`rounded-xl p-4 border-l-4 ${
                  notification.tone === "warning"
                    ? "border-l-red-600"
                    : notification.tone === "success"
                      ? "border-l-green-600"
                      : "border-l-blue-600"
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${
                      notification.tone === "warning"
                        ? "bg-red-100"
                        : notification.tone === "success"
                          ? "bg-green-100"
                          : "bg-blue-100"
                    }`}
                  >
                    {notification.tone === "warning" ? (
                      <AlertCircle className="text-red-600" size={20} />
                    ) : (
                      <Bell className="text-blue-600" size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
