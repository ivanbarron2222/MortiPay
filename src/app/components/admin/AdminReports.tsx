import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, FileSpreadsheet, FileText, Lock } from "lucide-react";
import { Card } from "../ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { getDemoUsers, type DemoUserAccount } from "../../lib/demo-users";
import {
  formatDueDate,
  getAdminReportAnalytics,
  type AdminReportAnalytics,
} from "../../lib/admin-reporting";
import { formatPhpCurrency } from "../../lib/financing";
import { getCurrentTenantSummary, type TenantSummary } from "../../lib/platform";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildWorkbookXml(tenant: TenantSummary | null, analytics: AdminReportAnalytics) {
  const summaryRows = [
    ["Metric", "Value"],
    ["Tenant", tenant?.name ?? "Tenant"],
    ["Plan", tenant?.plan ?? "free"],
    ["Total Receivable", analytics.totalReceivable.toFixed(2)],
    ["Collected This Month", analytics.totalCollectedThisMonth.toFixed(2)],
    ["Overdue Amount", analytics.overdueAmount.toFixed(2)],
    ["Due This Week", analytics.dueThisWeekAmount.toFixed(2)],
    ["Outstanding Balance", analytics.totalOutstanding.toFixed(2)],
    ["Collection Coverage Rate", analytics.collectionCoverageRate.toFixed(2)],
    ["Delinquency Rate", analytics.delinquencyRate.toFixed(2)],
    ["Average Days Late", analytics.averageDaysLate.toFixed(2)],
    ["30 Day Forecast", analytics.thirtyDayForecast.toFixed(2)],
    ["60 Day Forecast", analytics.sixtyDayForecast.toFixed(2)],
  ];

  const trendRows = [
    ["Month", "Collected", "Due Pipeline"],
    ...analytics.collectionTrend.map((entry, index) => [
      entry.label,
      entry.value.toFixed(2),
      analytics.duePipeline[index]?.value.toFixed(2) ?? "0.00",
    ]),
  ];

  const agingRows = [
    ["Bucket", "Amount"],
    ...analytics.agingBuckets.map((entry) => [entry.label, entry.value.toFixed(2)]),
  ];

  const riskRows = [
    ["Segment", "Count"],
    ...analytics.riskSegments.map((entry) => [entry.label, String(entry.value)]),
  ];

  const watchlistRows = [
    ["Name", "User ID", "Overdue Count", "Overdue Balance", "Outstanding Balance", "Next Due"],
    ...analytics.watchlist.map((entry) => [
      entry.user.fullName,
      entry.user.id,
      String(entry.overdueInstallmentCount),
      entry.overdueBalance.toFixed(2),
      entry.outstandingBalance.toFixed(2),
      entry.nextDue ? formatDueDate(entry.nextDue.dueDate) : "Fully paid",
    ]),
  ];

  const renderWorksheet = (name: string, rows: string[][]) => `
    <Worksheet ss:Name="${escapeXml(name)}">
      <Table>
        ${rows
          .map(
            (row) => `
              <Row>
                ${row
                  .map(
                    (cell) => `
                      <Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>
                    `,
                  )
                  .join("")}
              </Row>
            `,
          )
          .join("")}
      </Table>
    </Worksheet>
  `;

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  ${renderWorksheet("Summary", summaryRows)}
  ${renderWorksheet("Trends", trendRows)}
  ${renderWorksheet("Aging", agingRows)}
  ${renderWorksheet("Risk", riskRows)}
  ${renderWorksheet("Watchlist", watchlistRows)}
</Workbook>`;
}

function downloadFile(content: BlobPart, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openPrintReport(tenant: TenantSummary | null, analytics: AdminReportAnalytics) {
  const reportWindow = window.open("", "_blank", "width=960,height=720");
  if (!reportWindow) return;

  const watchlistRows =
    analytics.watchlist.length > 0
      ? analytics.watchlist
          .map(
            (entry) => `
              <tr>
                <td>${entry.user.fullName}</td>
                <td>${entry.user.id}</td>
                <td>${entry.overdueInstallmentCount}</td>
                <td>${formatPhpCurrency(entry.overdueBalance)}</td>
                <td>${formatPhpCurrency(entry.outstandingBalance)}</td>
                <td>${entry.nextDue ? formatDueDate(entry.nextDue.dueDate) : "Fully paid"}</td>
              </tr>
            `,
          )
          .join("")
      : '<tr><td colspan="6">No watchlist records.</td></tr>';

  reportWindow.document.write(`
    <html>
      <head>
        <title>Tenant Report</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; background: #f8fafc; }
          .page { padding: 28px; }
          .hero { background: linear-gradient(135deg, #0f4c81, #2563eb); color: white; border-radius: 18px; padding: 24px; margin-bottom: 20px; }
          .hero h1 { margin: 0 0 6px; font-size: 28px; }
          .hero p { margin: 0; font-size: 13px; opacity: 0.9; }
          h2 { margin: 20px 0 8px; font-size: 18px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { background: white; border: 1px solid #dbe4f0; border-radius: 14px; padding: 14px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
          .value { font-size: 20px; font-weight: 700; margin-top: 6px; }
          .subgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; background: white; border-radius: 12px; overflow: hidden; }
          th, td { border: 1px solid #dbe4f0; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #eff6ff; color: #1e3a8a; }
          .section-note { color: #475569; font-size: 12px; margin: 0 0 8px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="hero">
            <h1>MORTI Pay Premium Report</h1>
            <p>${tenant?.name ?? "Tenant"} | Plan: ${tenant?.plan ?? "free"} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          <div class="grid">
            <div class="card"><div class="label">Total Receivable</div><div class="value">${formatPhpCurrency(analytics.totalReceivable)}</div></div>
            <div class="card"><div class="label">Collected This Month</div><div class="value">${formatPhpCurrency(analytics.totalCollectedThisMonth)}</div></div>
            <div class="card"><div class="label">Overdue Amount</div><div class="value">${formatPhpCurrency(analytics.overdueAmount)}</div></div>
            <div class="card"><div class="label">30-Day Forecast</div><div class="value">${formatPhpCurrency(analytics.thirtyDayForecast)}</div></div>
          </div>
          <div class="subgrid">
            <div class="card"><div class="label">Collection Coverage</div><div class="value">${analytics.collectionCoverageRate.toFixed(1)}%</div></div>
            <div class="card"><div class="label">Delinquency Rate</div><div class="value">${analytics.delinquencyRate.toFixed(1)}%</div></div>
          </div>
          <h2>Portfolio Aging</h2>
          <p class="section-note">Outstanding balances grouped by current and delinquency bucket.</p>
          <table>
            <thead><tr><th>Bucket</th><th>Amount</th></tr></thead>
            <tbody>
              ${analytics.agingBuckets
                .map(
                  (entry) => `<tr><td>${entry.label}</td><td>${formatPhpCurrency(entry.value)}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <h2>Risk Segmentation</h2>
          <p class="section-note">Borrowers grouped by current collection risk level.</p>
          <table>
            <thead><tr><th>Risk Segment</th><th>Borrower Count</th></tr></thead>
            <tbody>
              ${analytics.riskSegments
                .map((entry) => `<tr><td>${entry.label}</td><td>${entry.value}</td></tr>`)
                .join("")}
            </tbody>
          </table>
          <h2>Borrower Watchlist</h2>
          <p class="section-note">Highest-priority follow-up accounts based on overdue activity and exposure.</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Overdue Count</th>
                <th>Overdue Balance</th>
                <th>Outstanding</th>
                <th>Next Due</th>
              </tr>
            </thead>
            <tbody>${watchlistRows}</tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

export function AdminReports() {
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

  const analytics = useMemo(() => getAdminReportAnalytics(users), [users]);
  const isPremium = tenant?.plan === "premium";
  const visibleCollectionTrend = isPremium
    ? analytics.collectionTrend
    : analytics.collectionTrend.slice(-2);
  const visibleDuePipeline = isPremium
    ? analytics.duePipeline
    : analytics.duePipeline.slice(0, 2);
  const visibleWatchlist = isPremium
    ? analytics.watchlist
    : analytics.watchlist.slice(0, 3);

  const collectionChartConfig = {
    collected: {
      label: "Collected",
      color: "#10b981",
    },
  };
  const duePipelineChartConfig = {
    due: {
      label: "Due Pipeline",
      color: "#2563eb",
    },
  };
  const agingChartConfig = {
    aging: {
      label: "Aging",
      color: "#f59e0b",
    },
  };
  const riskChartConfig = {
    risk: {
      label: "Risk",
      color: "#ef4444",
    },
  };
  const agingColors = ["#cbd5e1", "#fbbf24", "#fb923c", "#ef4444"];
  const riskColors = ["#10b981", "#f59e0b", "#ef4444"];

  const handleExportExcel = () => {
    if (!isPremium) return;
    downloadFile(
      buildWorkbookXml(tenant, analytics),
      `${tenant?.slug ?? "tenant"}-report.xls`,
      "application/vnd.ms-excel",
    );
  };

  const handleExportPdf = () => {
    if (!isPremium) return;
    openPrintReport(tenant, analytics);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">
            Dedicated analytics and export workspace for tenant-admin reporting.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPdf}
            disabled={!isPremium}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            <FileText size={16} />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={!isPremium}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {!isPremium ? (
        <Card className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 text-slate-600" size={18} />
            <div>
              <p className="font-semibold text-slate-800">Premium Reports Only</p>
              <p className="mt-1 text-sm text-slate-600">
                Free tenants can view report previews, but PDF and Excel exports are only
                available on premium.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Free preview is limited to shorter reporting history. Premium unlocks the full
                reporting window and complete exportable analytics.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Collection Trend</h2>
              <p className="mt-1 text-sm text-gray-600">
                Paid installment value mapped to scheduled installment months.
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="mt-6">
            <ChartContainer config={collectionChartConfig} className="h-[280px] w-full">
              <LineChart data={visibleCollectionTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Collected"
                  stroke="var(--color-collected)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Performance</h2>
          <p className="mt-1 text-sm text-gray-600">
            Coverage and delinquency based on scheduled installments to date.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Collection Coverage</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {analytics.collectionCoverageRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-red-50 px-4 py-3">
              <p className="text-xs text-red-600">Delinquency Rate</p>
              <p className="mt-1 text-2xl font-bold text-red-700">
                {analytics.delinquencyRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Average Days Late</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {analytics.averageDaysLate.toFixed(1)} days
              </p>
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
            <ChartContainer config={duePipelineChartConfig} className="h-[280px] w-full">
              <BarChart data={visibleDuePipeline}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="value"
                  name="Due Pipeline"
                  fill="var(--color-due)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Premium Forecast</h2>
          <p className="mt-1 text-sm text-gray-600">
            Forward-looking collection estimate for premium reporting.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Next 30 Days</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {isPremium ? formatPhpCurrency(analytics.thirtyDayForecast) : "Locked"}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Next 60 Days</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {isPremium ? formatPhpCurrency(analytics.sixtyDayForecast) : "Locked"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Portfolio Aging</h2>
          <div className="mt-4">
            <ChartContainer config={agingChartConfig} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={analytics.agingBuckets}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {analytics.agingBuckets.map((entry, index) => (
                    <Cell key={entry.label} fill={agingColors[index % agingColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-4 space-y-2">
            {analytics.agingBuckets.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-600">{entry.label}</span>
                <span className="font-semibold text-gray-900">
                  {isPremium ? formatPhpCurrency(entry.value) : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Risk Segmentation</h2>
          <div className="mt-4">
            <ChartContainer config={riskChartConfig} className="h-[240px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={analytics.riskSegments}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={90}
                  strokeWidth={2}
                >
                  {analytics.riskSegments.map((entry, index) => (
                    <Cell key={entry.label} fill={riskColors[index % riskColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
          <div className="mt-4 space-y-2">
            {analytics.riskSegments.map((entry) => (
              <div
                key={entry.label}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
              >
                <span className="text-gray-600">{entry.label}</span>
                <span className="font-semibold text-gray-900">
                  {isPremium ? entry.value : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Report Snapshot</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Average Principal</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {isPremium ? formatPhpCurrency(analytics.averagePrincipal) : "Locked"}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Term Mix</p>
              <div className="mt-2 space-y-1">
                {analytics.termMix.map((entry) => (
                  <div key={entry.term} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{entry.term} months</span>
                    <span className="font-semibold text-gray-900">
                      {isPremium ? entry.count : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-xl p-6 xl:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Borrower Watchlist</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isPremium
              ? "Full watchlist with the highest-priority collection follow-ups."
              : "Preview of the current watchlist. Premium unlocks the full reporting scope."}
          </p>
          <div className="mt-5 space-y-3">
            {visibleWatchlist.map((entry) => (
              <div
                key={entry.user.id}
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.user.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {entry.user.id} | {entry.user.loanProfile?.motorcycle}
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
            {!isPremium && analytics.watchlist.length > visibleWatchlist.length ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Premium unlocks the full watchlist and longer reporting history.
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900">Support Access</h2>
          <p className="mt-1 text-sm text-gray-600">
            {isPremium
              ? "Priority support channel for premium tenant admins."
              : "Basic support guidance for free tenants."}
          </p>
          {isPremium ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Priority Support</p>
                <p className="mt-2 text-sm text-emerald-800">
                  Premium tenants receive priority handling for report, monitoring, and tenant
                  operations concerns.
                </p>
              </div>
              <a
                href={`mailto:premium-support@mortipay.local?subject=${encodeURIComponent(
                  `Priority support request - ${tenant?.name ?? "Tenant"}`,
                )}`}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Contact Priority Support
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Free tenants can continue using the standard support path. Upgrade to premium for
              faster issue handling and priority review.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
