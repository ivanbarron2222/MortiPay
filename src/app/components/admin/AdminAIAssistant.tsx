import { useEffect, useMemo, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  evaluateDemoUserLocationAlert,
  getDemoUsers,
  type DemoUserAccount,
} from "../../lib/demo-users";
import { getAdminReportAnalytics } from "../../lib/admin-reporting";
import { formatPhpCurrency } from "../../lib/financing";
import { type TenantSummary } from "../../lib/platform";

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type QuickAction = {
  label: string;
  prompt: string;
};

const quickActions: QuickAction[] = [
  {
    label: "Summarize dashboard",
    prompt: "Summarize dashboard",
  },
  {
    label: "Who should I follow up today?",
    prompt: "Who should I follow up today?",
  },
  {
    label: "Explain overdue accounts",
    prompt: "Explain overdue accounts",
  },
  {
    label: "Draft payment reminder",
    prompt: "Draft payment reminder",
  },
];

function buildAssistantResponse(prompt: string, users: DemoUserAccount[], tenant: TenantSummary) {
  const tenantUsers = users.filter((user) => user.role === "tenant_user");
  const analytics = getAdminReportAnalytics(tenantUsers);
  const normalizedPrompt = prompt.toLowerCase();
  const topWatchlist = analytics.watchlist[0];
  const locationAlerts = tenantUsers
    .map((user) => ({
      user,
      alert: evaluateDemoUserLocationAlert(user),
    }))
    .filter(
      (entry) =>
        entry.alert.status === "location_off" || entry.alert.status === "stale",
    );

  if (normalizedPrompt.includes("follow")) {
    if (analytics.watchlist.length === 0) {
      return "No borrowers need immediate follow-up. There are no overdue or high outstanding accounts in the current watchlist.";
    }

    return [
      "Today's priority follow-ups:",
      ...analytics.watchlist.slice(0, 3).map((entry, index) => {
        const dueText = entry.nextDue
          ? new Date(entry.nextDue.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          : "Fully paid";
        return `${index + 1}. ${entry.user.fullName} - ${entry.overdueInstallmentCount} overdue installment(s), ${formatPhpCurrency(entry.overdueBalance)} overdue, ${formatPhpCurrency(entry.outstandingBalance)} outstanding. Next due: ${dueText}.`;
      }),
    ].join("\n");
  }

  if (normalizedPrompt.includes("overdue") || normalizedPrompt.includes("delinquency")) {
    return [
      `There are ${analytics.overdueLoans} overdue loan account(s) with ${formatPhpCurrency(analytics.overdueAmount)} overdue.`,
      `The delinquency rate is ${analytics.delinquencyRate.toFixed(1)}% based on scheduled installments due to date.`,
      `Average days late is ${analytics.averageDaysLate.toFixed(1)} day(s).`,
      analytics.overdueInstallmentCount > 0
        ? "Suggested action: prioritize borrowers with multiple overdue installments before contacting accounts with only upcoming dues."
        : "Suggested action: keep reminders focused on upcoming due dates to prevent new overdue accounts.",
    ].join("\n");
  }

  if (normalizedPrompt.includes("reminder") || normalizedPrompt.includes("message")) {
    if (!topWatchlist) {
      return "Reminder draft:\n\nHello, this is a reminder from your motorcycle financing admin. Please check your upcoming payment schedule and settle your installment on or before the due date. Thank you.";
    }

    return [
      `Reminder draft for ${topWatchlist.user.fullName}:`,
      "",
      `Hello ${topWatchlist.user.fullName}, this is a reminder about your motorcycle installment. Our records show ${formatPhpCurrency(topWatchlist.overdueBalance)} overdue and ${formatPhpCurrency(topWatchlist.outstandingBalance)} total outstanding. Please settle your overdue payment or contact us if you need assistance. Thank you.`,
    ].join("\n");
  }

  if (normalizedPrompt.includes("location")) {
    if (locationAlerts.length === 0) {
      return "All monitored borrowers currently have acceptable location heartbeat status.";
    }

    return [
      `${locationAlerts.length} borrower(s) need location monitoring attention:`,
      ...locationAlerts.slice(0, 3).map((entry, index) => {
        return `${index + 1}. ${entry.user.fullName} - ${entry.alert.message}`;
      }),
    ].join("\n");
  }

  return [
    `${tenant.name} dashboard summary:`,
    `Total receivable is ${formatPhpCurrency(analytics.totalReceivable)}, with ${formatPhpCurrency(analytics.totalOutstanding)} still outstanding.`,
    `Collected this month: ${formatPhpCurrency(analytics.totalCollectedThisMonth)}.`,
    `Due this week: ${formatPhpCurrency(analytics.dueThisWeekAmount)}.`,
    `Overdue exposure: ${formatPhpCurrency(analytics.overdueAmount)} across ${analytics.overdueLoans} overdue loan account(s).`,
    `Collection coverage is ${analytics.collectionCoverageRate.toFixed(1)}%, and the 30-day collection forecast is ${formatPhpCurrency(analytics.thirtyDayForecast)}.`,
  ].join("\n");
}

export function AdminAIAssistant({ tenant }: { tenant: TenantSummary }) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "I can summarize collections, identify follow-up priorities, explain overdue accounts, and draft payment reminders.",
    },
  ]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void getDemoUsers().then((nextUsers) => {
      if (!active) return;
      setUsers(nextUsers);
    });
    return () => {
      active = false;
    };
  }, [open]);

  const tenantUsers = useMemo(
    () => users.filter((user) => user.role === "tenant_user"),
    [users],
  );
  const analytics = useMemo(() => getAdminReportAnalytics(tenantUsers), [tenantUsers]);

  const submitPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: buildAssistantResponse(trimmed, users, tenant),
      },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700"
        aria-label="Open AI assistant"
      >
        <Sparkles size={24} />
      </button>

      {open ? (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[420px] rounded-2xl border border-blue-100 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:mx-0">
          <div className="flex items-start justify-between rounded-t-2xl bg-blue-700 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2">
                <Bot size={18} />
              </div>
              <div>
                <h2 className="font-semibold">AI Assistant</h2>
                <p className="text-xs text-blue-100">Premium admin insights</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-blue-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Close AI assistant"
            >
              <X size={18} />
            </button>
          </div>

          <div className="border-b border-gray-100 px-5 py-4">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => submitPrompt(action.prompt)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-4">
            <div className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800">
              {analytics.overdueLoans} overdue account(s) |{" "}
              {formatPhpCurrency(analytics.dueThisWeekAmount)} due this week
            </div>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitPrompt(input);
            }}
            className="border-t border-gray-100 p-4"
          >
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about collections, overdue accounts, reminders..."
                className="min-h-11 resize-none rounded-xl text-sm"
                rows={1}
              />
              <Button
                type="submit"
                className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 p-0 hover:bg-blue-700"
                aria-label="Send message"
              >
                <Send size={17} />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
              <MessageCircle size={12} />
              Uses current tenant data. External AI API can be connected later.
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
