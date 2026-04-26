import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CreditCard,
  FileText,
  Lock,
  Users,
} from "lucide-react";
import { Card } from "../ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import {
  evaluateDemoUserLocationAlert,
  getDemoUsers,
  type DemoUserAccount,
} from "../../lib/demo-users";
import {
  formatDueDate,
  getAdminReportAnalytics,
} from "../../lib/admin-reporting";
import { formatPhpCurrency } from "../../lib/financing";
import {
  getCurrentTenantSummary,
  type TenantSummary,
} from "../../lib/platform";

const collectionChartConfig = {
  value: {
    label: "Collected",
    color: "#16a34a",
  },
};

const duePipelineChartConfig = {
  value: {
    label: "Due",
    color: "#2563eb",
  },
};

export function AdminDashboard() {
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextUsers, nextTenant] = await Promise.all([
        getDemoUsers(),
        getCurrentTenantSummary(),
      ]);
      if (!active) return;
      setUsers(nextUsers.filter((user) => user.role === "tenant_user"));
      setTenant(nextTenant);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const withLoans = users.filter((user) => user.loanProfile);
  const locationAlerts = useMemo(
    () =>
      users
        .map((user) => ({
          user,
          alert: evaluateDemoUserLocationAlert(user),
        }))
        .filter(
          (entry) =>
            entry.alert.status === "location_off" || entry.alert.status === "stale",
        ),
    [users],
  );

  const analytics = useMemo(() => getAdminReportAnalytics(users), [users]);

  const isPremium = tenant?.plan === "premium";
  const hasPendingPremiumRequest = tenant?.requestedPlan === "premium";
  const maxRiskSegment = Math.max(
    ...analytics.riskSegments.map((entry) => entry.value),
    1,
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
      value: formatPhpCurrency(analytics.totalReceivable),
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Collected This Month",
      value: formatPhpCurrency(analytics.totalCollectedThisMonth),
      icon: BarChart3,
      color: "bg-emerald-100 text-emerald-700",
    },
  ];

  const getGoogleMapsUrl = (latitude: number, longitude: number) =>
    `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Tenant admin workspace with plan-aware features, collections tracking, and borrower
          monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="rounded-xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="mb-1 text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </Card>
          );
        })}
      </div>

      {isPremium ? (
        <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Tenant Plan
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Premium workspace is active</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Premium tenants can access advanced monitoring, richer analytics, exports, and
                deeper portfolio insights.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Request Status</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Approved</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Collection Analytics</h2>
              <p className="mt-1 text-sm text-gray-600">
                Six-month collected installment trend for this tenant.
              </p>
            </div>
            <div className="rounded-full bg-green-50 p-3 text-green-700">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="mt-6">
            <ChartContainer config={collectionChartConfig} className="h-[260px] w-full">
              <LineChart data={analytics.collectionTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Collected"
                  stroke="var(--color-value)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Performance Summary</h2>
          <p className="mt-1 text-sm text-gray-600">
            Key ratios from scheduled installments due to date.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-green-50 px-4 py-3">
              <p className="text-xs text-green-700">Collection Coverage</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {analytics.collectionCoverageRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Delinquency Rate</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {analytics.delinquencyRate.toFixed(1)}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-500">Avg. Days Late</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {analytics.averageDaysLate.toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700">30-Day Forecast</p>
                <p className="mt-1 text-lg font-bold text-blue-800">
                  {formatPhpCurrency(analytics.thirtyDayForecast)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Due Pipeline</h2>
          <p className="mt-1 text-sm text-gray-600">
            Scheduled unpaid installments across the next four months.
          </p>
          <div className="mt-6">
            <ChartContainer config={duePipelineChartConfig} className="h-[240px] w-full">
              <BarChart data={analytics.duePipeline}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="value"
                  name="Due"
                  fill="var(--color-value)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Risk Summary</h2>
          <p className="mt-1 text-sm text-gray-600">
            Borrower segmentation based on due and overdue exposure.
          </p>
          <div className="mt-5 space-y-4">
            {analytics.riskSegments.map((entry) => (
              <div key={entry.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{entry.label}</span>
                  <span className="font-semibold text-gray-900">{entry.value}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      entry.label === "High Risk"
                        ? "bg-red-500"
                        : entry.label === "Medium Risk"
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${(entry.value / maxRiskSegment) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Collections Snapshot</h2>
              <p className="mt-1 text-sm text-gray-600">
                Current due exposure and collection position for this tenant.
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
              <CreditCard size={20} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Due This Week</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatPhpCurrency(analytics.dueThisWeekAmount)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Upcoming unpaid installments due within the next 7 days.
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs uppercase tracking-wide text-red-600">Overdue Amount</p>
              <p className="mt-2 text-2xl font-bold text-red-700">
                {formatPhpCurrency(analytics.overdueAmount)}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Unpaid installments whose due date has already passed.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Outstanding Balance</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatPhpCurrency(analytics.totalOutstanding)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Remaining unpaid installment exposure across active borrowers.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">New Loans This Month</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {analytics.newLoansThisMonth}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Recently added financed accounts in the current month.
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Portfolio Health</h2>
              <p className="mt-1 text-sm text-gray-600">
                Active loan distribution for collection monitoring.
              </p>
            </div>
            <div className="rounded-full bg-amber-50 p-3 text-amber-600">
              <CalendarClock size={20} />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Active Loans</span>
              <span className="text-lg font-bold text-gray-900">{analytics.activeLoans}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Fully Paid Loans</span>
              <span className="text-lg font-bold text-gray-900">{analytics.fullyPaidLoans}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
              <span className="text-sm text-red-700">Overdue Loans</span>
              <span className="text-lg font-bold text-red-700">{analytics.overdueLoans}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Borrower Watchlist</h2>
              <p className="mt-1 text-sm text-gray-600">
                Prioritize follow-up on borrowers with overdue exposure or high outstanding
                balance.
              </p>
            </div>
            <div className="rounded-full bg-red-50 p-3 text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {analytics.watchlist.map((entry) => (
              <div
                key={entry.user.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.user.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {entry.user.loanProfile?.motorcycle} | {entry.user.id}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {entry.overdueInstallmentCount > 0
                      ? `${entry.overdueInstallmentCount} overdue`
                      : "Upcoming due"}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Overdue Balance</p>
                    <p className="mt-1 text-sm font-semibold text-red-700">
                      {formatPhpCurrency(entry.overdueBalance)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Outstanding Balance</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatPhpCurrency(entry.outstandingBalance)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-2">
                    <p className="text-xs text-gray-500">Next Due</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {entry.nextDue ? formatDueDate(entry.nextDue.dueDate) : "Fully paid"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {analytics.watchlist.length === 0 ? (
              <p className="text-sm text-gray-600">No accounts need immediate follow-up.</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Action Queue</h2>
              <p className="mt-1 text-sm text-gray-600">
                Keep the dashboard focused on immediate collection priorities.
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
              <span className="text-sm text-red-700">Accounts with overdue loans</span>
              <span className="text-lg font-bold text-red-700">{analytics.overdueLoans}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
              <span className="text-sm text-amber-700">Installments due this week</span>
              <span className="text-lg font-bold text-amber-700">
                {analytics.upcomingInstallmentCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
              <span className="text-sm text-gray-600">Borrowers on watchlist</span>
              <span className="text-lg font-bold text-gray-900">
                {analytics.watchlist.length}
              </span>
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Use the new `Reports` page in the sidebar for trend analytics, premium portfolio
              insights, and report exports.
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl p-6">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Loan Accounts</h2>
        <div className="space-y-3">
          {withLoans.slice(0, 5).map((user) => (
            <div key={user.id} className="rounded-lg bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">
                {user.loanProfile?.motorcycle} | {user.loanProfile?.termMonths} months
              </p>
              <p className="mt-1 text-sm text-gray-900">
                Monthly: {formatPhpCurrency(user.loanProfile?.monthlyInstallment ?? 0)}
              </p>
            </div>
          ))}
          {withLoans.length === 0 ? (
            <p className="text-sm text-gray-600">No loan accounts yet.</p>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Advanced Location Monitoring</h2>
          {!isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <Lock size={12} />
              Premium Only
            </span>
          ) : null}
        </div>

        {!isPremium ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            Upgrade to premium to view stale heartbeat alerts, map links, and monitoring
            escalation.
          </div>
        ) : (
          <div className="space-y-3">
            {locationAlerts.map(({ user, alert }) => (
              <div key={user.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-gray-900">
                  {user.fullName} ({user.id})
                </p>
                <p className="mt-1 text-sm text-red-700">{alert.message}</p>
                <p className="mt-1 text-xs text-gray-600">
                  Last heartbeat: {user.locationTracking?.lastHeartbeatAt ?? "none"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  Latitude:{" "}
                  {typeof user.locationTracking?.latitude === "number"
                    ? user.locationTracking.latitude.toFixed(6)
                    : "none"}{" "}
                  | Longitude:{" "}
                  {typeof user.locationTracking?.longitude === "number"
                    ? user.locationTracking.longitude.toFixed(6)
                    : "none"}
                </p>
                {typeof user.locationTracking?.latitude === "number" &&
                typeof user.locationTracking?.longitude === "number" ? (
                  <a
                    href={getGoogleMapsUrl(
                      user.locationTracking.latitude,
                      user.locationTracking.longitude,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-blue-700 underline"
                  >
                    Open in Google Maps
                  </a>
                ) : null}
              </div>
            ))}
            {locationAlerts.length === 0 ? (
              <p className="text-sm text-gray-600">All users have active location heartbeat.</p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
