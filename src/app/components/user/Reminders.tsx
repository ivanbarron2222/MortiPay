import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CircleAlert,
  Clock3,
  MapPinned,
  PhoneCall,
} from "lucide-react";
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
import {
  evaluateDemoUserLocationAlert,
  getCurrentDemoUser,
  type DemoUserAccount,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";
import {
  getNextUserInstallment,
  getUpcomingUserPayments,
  getUserLoanStatus,
  getUserReminderTrigger,
} from "../../lib/user-loan";

type ReminderNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  tone: "info" | "warning" | "success";
  ctaLabel: string;
  ctaPath: "/user/loan-details" | "/user/support" | "/user/account";
};

const DAILY_OVERDUE_PENALTY = 50;

export function Reminders() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<DemoUserAccount | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<ReminderNotification | null>(null);
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
  const upcomingPayments = useMemo(() => getUpcomingUserPayments(loan, 3), [loan]);
  const loanStatus = useMemo(() => getUserLoanStatus(loan), [loan]);
  const reminderTrigger = useMemo(() => getUserReminderTrigger(loan), [loan]);
  const locationAlert = useMemo(
    () => (currentUser ? evaluateDemoUserLocationAlert(currentUser) : null),
    [currentUser],
  );

  const reminderNotifications = useMemo(() => {
    const list: ReminderNotification[] = [];

    if (!loan || !nextInstallment) {
      list.push({
        id: "no-loan",
        title: "No Active Loan Reminder",
        message: "No due installment found yet. Admin will assign your loan schedule.",
        time: "Today",
        tone: "info",
        ctaLabel: "Open Account",
        ctaPath: "/user/account",
      });
      return list;
    }

    const dueDateLabel = nextInstallment.dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    if (reminderTrigger?.kind === "due_7_days") {
      list.push({
        id: `due-7-days-${nextInstallment.installmentNumber}-${nextInstallment.daysUntilDue}`,
        title: reminderTrigger.title,
        message: `${reminderTrigger.message} (${dueDateLabel}).`,
        time: "Today, 9:00 AM",
        tone: reminderTrigger.tone,
        ctaLabel: "Review Loan",
        ctaPath: "/user/loan-details",
      });
    }

    if (reminderTrigger?.kind === "due_3_days") {
      list.push({
        id: `due-3-days-${nextInstallment.installmentNumber}-${nextInstallment.daysUntilDue}`,
        title: reminderTrigger.title,
        message: `${reminderTrigger.message} (${dueDateLabel}).`,
        time: "Today, 9:00 AM",
        tone: reminderTrigger.tone,
        ctaLabel: "Review Loan",
        ctaPath: "/user/loan-details",
      });
    }

    if (reminderTrigger?.kind === "due_today") {
      list.push({
        id: `due-today-${nextInstallment.installmentNumber}`,
        title: reminderTrigger.title,
        message: reminderTrigger.message,
        time: "Today, 9:00 AM",
        tone: reminderTrigger.tone,
        ctaLabel: "Contact Support",
        ctaPath: "/user/support",
      });
    }

    if (reminderTrigger?.kind === "overdue") {
      const penalty = nextInstallment.overdueDays * DAILY_OVERDUE_PENALTY;
      list.push({
        id: `overdue-alert-${nextInstallment.installmentNumber}-${nextInstallment.overdueDays}`,
        title: reminderTrigger.title,
        message: `Overdue by ${nextInstallment.overdueDays} day(s). Penalty is ${formatPhpCurrency(
          penalty,
        )} (${formatPhpCurrency(DAILY_OVERDUE_PENALTY)}/day).`,
        time: "Today, 9:00 AM",
        tone: reminderTrigger.tone,
        ctaLabel: "Contact Support",
        ctaPath: "/user/support",
      });
    }

    if (locationAlert && locationAlert.status !== "tracking") {
      list.push({
        id: "location-status",
        title: "Location Status Needs Attention",
        message: locationAlert.message,
        time: "Live status",
        tone: "warning",
        ctaLabel: "Open Account",
        ctaPath: "/user/account",
      });
    }

    if (list.length === 0) {
      list.push({
        id: "no-trigger",
        title: "No Reminder Trigger Today",
        message:
          "Your account is on schedule. Alerts are triggered at 7 days, 3 days, due today, and overdue.",
        time: "Today, 9:00 AM",
        tone: "success",
        ctaLabel: "View Loan",
        ctaPath: "/user/loan-details",
      });
    }

    return list;
  }, [loan, nextInstallment, locationAlert, reminderTrigger]);

  const primaryAlert = reminderNotifications[0] ?? null;

  useEffect(() => {
    if (!primaryAlert) return;
    const userId = currentUser?.id ?? "guest";
    const storageKey = `mf_last_reminder_alert_${userId}`;
    const alertKey = primaryAlert.id;
    const lastShown = window.sessionStorage.getItem(storageKey);
    if (lastShown === alertKey) return;
    const shouldAutoOpen = !["no-trigger", "no-loan"].includes(primaryAlert.id);
    if (shouldAutoOpen) {
      window.sessionStorage.setItem(storageKey, alertKey);
      setSelectedNotification(primaryAlert);
    }
  }, [primaryAlert, currentUser]);

  const locationCardClassName =
    locationAlert?.status === "tracking"
      ? "border-emerald-200 bg-emerald-50"
      : locationAlert?.status === "stale"
        ? "border-amber-200 bg-amber-50"
        : "border-red-200 bg-red-50";

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
                aria-label="Open reminder center"
                className="relative rounded-full p-1 text-blue-600 hover:bg-blue-50"
              >
                <Bell size={24} />
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <span className="text-[10px] font-bold text-white">
                    {reminderNotifications.length}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Reminder Center</DropdownMenuLabel>
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
            <Button
              onClick={() => {
                const path = selectedNotification?.ctaPath ?? "/user/loan-details";
                setSelectedNotification(null);
                navigate(path);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {selectedNotification?.ctaLabel ?? "Open"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4 px-6 py-6">
        <Card className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="mb-1 text-blue-100">Next Installment</p>
              <h2 className="text-3xl font-bold">
                {nextInstallment
                  ? nextInstallment.dueDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "-"}
              </h2>
              <p className="mt-2 text-sm text-blue-100">{loanStatus.message}</p>
            </div>
            <CalendarClock className="text-blue-200" size={32} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Amount due</p>
              <p className="mt-2 text-2xl font-bold">
                {nextInstallment ? formatPhpCurrency(nextInstallment.amount) : "-"}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">Status</p>
              <p className="mt-2 text-lg font-bold">
                {nextInstallment
                  ? nextInstallment.overdueDays > 0
                    ? `${nextInstallment.overdueDays} day(s) overdue`
                    : nextInstallment.daysUntilDue === 0
                      ? "Due today"
                      : `${nextInstallment.daysUntilDue} day(s) remaining`
                  : "No active installment"}
              </p>
            </div>
          </div>
        </Card>

        {nextInstallment && nextInstallment.overdueDays > 0 ? (
          <Card className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
            <div className="flex items-start">
              <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
                <CircleAlert className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 font-bold text-red-900">Overdue Penalty Running</h3>
                <p className="mb-3 text-sm text-red-800">
                  Installment {nextInstallment.installmentNumber} is overdue by{" "}
                  {nextInstallment.overdueDays} day(s). Current penalty:{" "}
                  <span className="font-semibold">
                    {formatPhpCurrency(nextInstallment.overdueDays * DAILY_OVERDUE_PENALTY)}
                  </span>{" "}
                  ({formatPhpCurrency(DAILY_OVERDUE_PENALTY)} per day).
                </p>
                <Button
                  onClick={() => navigate("/user/support")}
                  className="rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4">
          <Card className="rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Reminder timeline</p>
                <h3 className="text-lg font-bold text-slate-900">Recent in-app alerts</h3>
              </div>
              <Clock3 className="h-5 w-5 text-slate-500" />
            </div>
            <div className="mt-5 space-y-3">
              {reminderNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => setSelectedNotification(notification)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors hover:bg-slate-50 ${
                    notification.tone === "warning"
                      ? "border-red-200"
                      : notification.tone === "success"
                        ? "border-emerald-200"
                        : "border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-2 text-xs text-slate-400">{notification.time}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        notification.tone === "warning"
                          ? "bg-red-100 text-red-700"
                          : notification.tone === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {notification.tone === "warning"
                        ? "Action"
                        : notification.tone === "success"
                          ? "Clear"
                          : "Info"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Upcoming schedule</p>
                <h3 className="text-lg font-bold text-slate-900">What to prepare for next</h3>
              </div>
              <CalendarClock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-5 space-y-3">
              {upcomingPayments.length > 0 ? (
                upcomingPayments.map((payment, index) => (
                  <div
                    key={`${payment.installmentNumber}-${payment.dueDateLabel}`}
                    className={`rounded-2xl border p-4 ${
                      index === 0 ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            Installment {payment.installmentNumber}
                          </p>
                          {index === 0 ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              Next
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500">Due on {payment.dueDateLabel}</p>
                      </div>
                      <span className="font-semibold text-blue-700">
                        {formatPhpCurrency(payment.amount)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No upcoming installment was found for this account.
                </div>
              )}
            </div>
          </Card>

          {locationAlert ? (
            <Card className={`rounded-2xl border p-5 ${locationCardClassName}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Location status</p>
                  <h3 className="text-lg font-bold text-slate-900">Tracking visibility</h3>
                  <p className="mt-2 text-sm text-slate-700">{locationAlert.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {locationAlert.minutesSinceHeartbeat !== null
                      ? `Last heartbeat ${locationAlert.minutesSinceHeartbeat} minute(s) ago`
                      : "No heartbeat timestamp available yet"}
                  </p>
                </div>
                <MapPinned
                  className={
                    locationAlert.status === "tracking"
                      ? "text-emerald-600"
                      : locationAlert.status === "stale"
                        ? "text-amber-600"
                        : "text-red-600"
                  }
                />
              </div>
            </Card>
          ) : null}
        </div>

        <Card className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-amber-800">Need help now?</p>
              <h3 className="text-lg font-bold text-amber-950">Quick actions</h3>
              <p className="mt-1 text-sm text-amber-900">
                Use support if you expect a delay, need clarification, or want to update account details.
              </p>
            </div>
            <PhoneCall className="h-5 w-5 text-amber-700" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => navigate("/user/support")}
              className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            >
              Contact Support
            </Button>
            <Button
              onClick={() => navigate("/user/loan-details")}
              variant="outline"
              className="rounded-xl border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              Review Loan Details
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
