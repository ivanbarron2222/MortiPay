import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, ShieldCheck, Store, Users } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import {
  getTenantSummaries,
  getTenantUserCounts,
  updateTenantStatus,
  type TenantPlan,
  type TenantStatus,
  type TenantSummary,
  type TenantUserCount,
} from "../../lib/platform";

const tenantStatuses: Array<"all" | TenantStatus> = [
  "all",
  "pending",
  "active",
  "suspended",
  "inactive",
];
const tenantPlans: Array<"all" | TenantPlan> = ["all", "free", "premium"];

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusClass(status: TenantStatus) {
  if (status === "active") return "bg-green-100 text-green-700";
  if (status === "pending") return "bg-blue-100 text-blue-700";
  if (status === "suspended") return "bg-red-100 text-red-700";
  return "bg-slate-200 text-slate-700";
}

function planClass(plan: TenantPlan) {
  return plan === "premium"
    ? "bg-green-100 text-green-700"
    : "bg-slate-100 text-slate-700";
}

export function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, TenantUserCount>>({});
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TenantStatus>("all");
  const [planFilter, setPlanFilter] = useState<"all" | TenantPlan>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingTenantId, setProcessingTenantId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [tenantRows, counts] = await Promise.all([
        getTenantSummaries(),
        getTenantUserCounts(),
      ]);
      setTenants(tenantRows);
      setUserCounts(counts);
      setSelectedTenantId((current) => current || tenantRows[0]?.id || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredTenants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const matchesQuery =
        !normalizedQuery ||
        tenant.name.toLowerCase().includes(normalizedQuery) ||
        tenant.slug.toLowerCase().includes(normalizedQuery) ||
        tenant.ownerEmail.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || tenant.status === statusFilter;
      const matchesPlan = planFilter === "all" || tenant.plan === planFilter;
      return matchesQuery && matchesStatus && matchesPlan;
    });
  }, [planFilter, query, statusFilter, tenants]);

  const selectedTenant =
    tenants.find((tenant) => tenant.id === selectedTenantId) ?? filteredTenants[0] ?? null;
  const selectedCounts = selectedTenant ? userCounts[selectedTenant.id] : null;

  const handleTenantStatusChange = async (
    tenant: TenantSummary,
    status: TenantStatus,
  ) => {
    if (tenant.status === status) return;
    setProcessingTenantId(tenant.id);
    setActionError("");
    try {
      await updateTenantStatus({
        tenantId: tenant.id,
        status,
      });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update tenant status.");
    } finally {
      setProcessingTenantId("");
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Tenant Management
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Tenants</h1>
          <p className="mt-2 text-slate-600">
            Review shops, manage access status, and inspect plan ownership.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-2xl p-4">
            <p className="text-2xl font-bold text-slate-950">{tenants.length}</p>
            <p className="text-xs text-slate-500">Total</p>
          </Card>
          <Card className="rounded-2xl p-4">
            <p className="text-2xl font-bold text-slate-950">
              {tenants.filter((tenant) => tenant.status === "active").length}
            </p>
            <p className="text-xs text-slate-500">Active</p>
          </Card>
          <Card className="rounded-2xl p-4">
            <p className="text-2xl font-bold text-slate-950">
              {tenants.filter((tenant) => tenant.plan === "premium").length}
            </p>
            <p className="text-xs text-slate-500">Premium</p>
          </Card>
        </div>
      </div>

      {error ? (
        <Card className="rounded-2xl border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      ) : null}
      {actionError ? (
        <Card className="rounded-2xl border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="rounded-2xl p-5">
          <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_160px]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search shop, code, or owner email"
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | TenantStatus)
              }
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            >
              {tenantStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status}
                </option>
              ))}
            </select>
            <select
              value={planFilter}
              onChange={(event) =>
                setPlanFilter(event.target.value as "all" | TenantPlan)
              }
              className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            >
              {tenantPlans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan === "all" ? "All plans" : plan}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(220px,1.4fr)_130px_120px_110px_140px] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Shop</span>
              <span>Status</span>
              <span>Plan</span>
              <span>Users</span>
              <span>Created</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {filteredTenants.map((tenant) => {
                const counts = userCounts[tenant.id];
                const selected = selectedTenant?.id === tenant.id;
                return (
                  <button
                    key={tenant.id}
                    onClick={() => setSelectedTenantId(tenant.id)}
                    className={`grid w-full grid-cols-[minmax(220px,1.4fr)_130px_120px_110px_140px] items-center px-4 py-4 text-left text-sm transition-colors ${
                      selected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">{tenant.name}</span>
                      <span className="block text-xs text-slate-500">
                        {tenant.slug} - {tenant.ownerEmail}
                      </span>
                    </span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                          tenant.status,
                        )}`}
                      >
                        {tenant.status}
                      </span>
                    </span>
                    <span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${planClass(
                          tenant.plan,
                        )}`}
                      >
                        {tenant.plan}
                      </span>
                    </span>
                    <span className="text-slate-700">{counts?.totalUsers ?? 0}</span>
                    <span className="text-slate-600">{formatDate(tenant.createdAt)}</span>
                  </button>
                );
              })}
              {!loading && filteredTenants.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No tenants match the current filters.
                </div>
              ) : null}
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading tenants...
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          {selectedTenant ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{selectedTenant.name}</h2>
                  <p className="text-sm text-slate-500">{selectedTenant.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <Users className="mb-2 text-slate-500" size={18} />
                  <p className="text-2xl font-bold text-slate-950">
                    {selectedCounts?.tenantUsers ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">Tenant users</p>
                </div>
                <div className="rounded-2xl bg-green-50 p-4">
                  <ShieldCheck className="mb-2 text-slate-500" size={18} />
                  <p className="text-2xl font-bold text-slate-950">
                    {selectedCounts?.tenantAdmins ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">Admins</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Owner Email
                  </p>
                  <p className="mt-1 text-slate-800">{selectedTenant.ownerEmail}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Plan
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${planClass(
                        selectedTenant.plan,
                      )}`}
                    >
                      {selectedTenant.plan}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass(
                        selectedTenant.status,
                      )}`}
                    >
                      {selectedTenant.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </p>
                  <p className="mt-1 text-slate-800">{formatDate(selectedTenant.createdAt)}</p>
                </div>
                {selectedTenant.requestedPlan ? (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle size={16} />
                      Premium request pending
                    </div>
                    <p className="mt-1 text-xs">
                      Requested {selectedTenant.requestedPlan} on{" "}
                      {formatDate(selectedTenant.premiumRequestedAt)}.
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Change Status
                </label>
                <select
                  value={selectedTenant.status}
                  onChange={(event) =>
                    handleTenantStatusChange(
                      selectedTenant,
                      event.target.value as TenantStatus,
                    )
                  }
                  disabled={processingTenantId === selectedTenant.id}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a tenant to view details.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
