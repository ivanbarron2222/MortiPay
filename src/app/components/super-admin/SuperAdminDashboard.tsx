import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Clock3, Crown, ShieldAlert, Store, Users } from "lucide-react";
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
import { Card } from "../ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import {
  getPlanRequestSummaries,
  getTenantSummaries,
  getTenantUserCounts,
  type PlanRequestSummary,
  type TenantSummary,
  type TenantUserCount,
} from "../../lib/platform";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [requests, setRequests] = useState<PlanRequestSummary[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, TenantUserCount>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [tenantRows, requestRows, counts] = await Promise.all([
          getTenantSummaries(),
          getPlanRequestSummaries(),
          getTenantUserCounts(),
        ]);
        if (!active) return;
        setTenants(tenantRows);
        setRequests(requestRows);
        setUserCounts(counts);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load platform data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Total Tenants",
        value: String(tenants.length),
        icon: Building2,
        className: "bg-blue-100 text-blue-700",
      },
      {
        label: "Premium Tenants",
        value: String(tenants.filter((tenant) => tenant.plan === "premium").length),
        icon: Crown,
        className: "bg-green-100 text-green-700",
      },
      {
        label: "Pending Requests",
        value: String(requests.filter((request) => request.status === "pending").length),
        icon: Clock3,
        className: "bg-blue-100 text-blue-700",
      },
      {
        label: "Suspended Tenants",
        value: String(tenants.filter((tenant) => tenant.status === "suspended").length),
        icon: ShieldAlert,
        className: "bg-red-100 text-red-700",
      },
    ],
    [requests, tenants],
  );

  const recentTenants = tenants.slice(0, 5);
  const pendingRequests = requests
    .filter((request) => request.status === "pending")
    .slice(0, 5);
  const planMix = [
    {
      name: "Free",
      value: tenants.filter((tenant) => tenant.plan === "free").length,
      fill: "#2563eb",
    },
    {
      name: "Premium",
      value: tenants.filter((tenant) => tenant.plan === "premium").length,
      fill: "#16a34a",
    },
  ];
  const statusDistribution = [
    {
      status: "Active",
      value: tenants.filter((tenant) => tenant.status === "active").length,
      fill: "#16a34a",
    },
    {
      status: "Pending",
      value: tenants.filter((tenant) => tenant.status === "pending").length,
      fill: "#2563eb",
    },
    {
      status: "Suspended",
      value: tenants.filter((tenant) => tenant.status === "suspended").length,
      fill: "#dc2626",
    },
    {
      status: "Inactive",
      value: tenants.filter((tenant) => tenant.status === "inactive").length,
      fill: "#64748b",
    },
  ];
  const requestStatusData = [
    {
      status: "Pending",
      value: requests.filter((request) => request.status === "pending").length,
      fill: "#2563eb",
    },
    {
      status: "Approved",
      value: requests.filter((request) => request.status === "approved").length,
      fill: "#16a34a",
    },
    {
      status: "Rejected",
      value: requests.filter((request) => request.status === "rejected").length,
      fill: "#dc2626",
    },
  ];
  const registrationTrend = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      key,
      month: formatMonthLabel(date),
      tenants: tenants.filter((tenant) => getMonthKey(tenant.createdAt) === key).length,
      premiumRequests: requests.filter((request) => getMonthKey(request.createdAt) === key)
        .length,
    };
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
          Platform Control
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Super Admin Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Monitor platform health and jump into tenant or upgrade workflows.
        </p>
      </div>

      {error ? (
        <Card className="rounded-2xl border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-xl p-3 ${metric.className}`}>
                  <Icon size={22} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-950">
                {loading ? "-" : metric.value}
              </p>
              <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">Platform Growth</h2>
            <p className="text-sm text-slate-600">
              Tenant registrations and premium-request volume over the last six months.
            </p>
          </div>
          <ChartContainer
            className="h-72 w-full"
            config={{
              tenants: { label: "Tenants", color: "#2563eb" },
              premiumRequests: { label: "Premium Requests", color: "#16a34a" },
            }}
          >
            <LineChart data={registrationTrend}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="tenants"
                stroke="var(--color-tenants)"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="premiumRequests"
                stroke="var(--color-premiumRequests)"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        </Card>

        <Card className="rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">Plan Mix</h2>
            <p className="text-sm text-slate-600">Free and premium tenant distribution.</p>
          </div>
          <ChartContainer
            className="h-72 w-full"
            config={{
              Free: { label: "Free", color: "#2563eb" },
              Premium: { label: "Premium", color: "#16a34a" },
            }}
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              <Pie
                data={planMix}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {planMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">Tenant Status</h2>
            <p className="text-sm text-slate-600">Current operational state of all shops.</p>
          </div>
          <ChartContainer
            className="h-72 w-full"
            config={{
              value: { label: "Tenants", color: "#2563eb" },
            }}
          >
            <BarChart data={statusDistribution}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {statusDistribution.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>

        <Card className="rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">Premium Request Outcomes</h2>
            <p className="text-sm text-slate-600">Pending, approved, and rejected requests.</p>
          </div>
          <ChartContainer
            className="h-72 w-full"
            config={{
              value: { label: "Requests", color: "#16a34a" },
            }}
          >
            <BarChart data={requestStatusData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {requestStatusData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Tenant Operations</h2>
              <p className="text-sm text-slate-600">
                Browse shops, filter plans, and manage tenant access.
              </p>
            </div>
            <button
              onClick={() => navigate("/super-admin/tenants")}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Open Tenants
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-blue-50 p-4">
              <Store className="mb-2 text-slate-500" size={18} />
              <p className="text-2xl font-bold text-slate-950">
                {tenants.filter((tenant) => tenant.status === "active").length}
              </p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4">
              <ShieldAlert className="mb-2 text-slate-500" size={18} />
              <p className="text-2xl font-bold text-slate-950">
                {tenants.filter((tenant) => tenant.status === "pending").length}
              </p>
              <p className="text-xs text-slate-500">Pending</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-4">
              <Users className="mb-2 text-slate-500" size={18} />
              <p className="text-2xl font-bold text-slate-950">
                {Object.values(userCounts).reduce(
                  (sum, count) => sum + count.tenantUsers,
                  0,
                )}
              </p>
              <p className="text-xs text-slate-500">Customers</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-950">{tenant.name}</p>
                  <p className="text-xs text-slate-500">
                    {tenant.slug} - {tenant.ownerEmail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-slate-700">
                    {tenant.plan}
                  </p>
                  <p className="text-xs text-slate-500">{tenant.status}</p>
                </div>
              </div>
            ))}
            {!loading && recentTenants.length === 0 ? (
              <p className="text-sm text-slate-500">No tenants found.</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Premium Requests</h2>
              <p className="text-sm text-slate-600">
                Review upgrade requests in a dedicated queue.
              </p>
            </div>
            <button
              onClick={() => navigate("/super-admin/premium-requests")}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Open Requests
            </button>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {request.tenant?.name ?? "Unknown Tenant"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {request.requestedByEmail} - {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase text-blue-700">
                    Pending
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {request.message || "No message provided."}
                </p>
              </div>
            ))}
            {!loading && pendingRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No pending premium requests.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
