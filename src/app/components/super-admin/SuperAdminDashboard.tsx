import { useEffect, useMemo, useState } from "react";
import { Building2, Clock3, Crown, ShieldAlert } from "lucide-react";
import { Card } from "../ui/card";
import {
  getPlanRequestSummaries,
  getTenantSummaries,
  reviewPremiumRequest,
  updateTenantStatus,
  type PlanRequestSummary,
  type TenantStatus,
  type TenantSummary,
} from "../../lib/platform";

export function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [requests, setRequests] = useState<PlanRequestSummary[]>([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [processingTenantId, setProcessingTenantId] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [tenantRows, requestRows] = await Promise.all([
          getTenantSummaries(),
          getPlanRequestSummaries(),
        ]);
        if (!active) return;
        setTenants(tenantRows);
        setRequests(requestRows);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load platform data.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    const [tenantRows, requestRows] = await Promise.all([
      getTenantSummaries(),
      getPlanRequestSummaries(),
    ]);
    setTenants(tenantRows);
    setRequests(requestRows);
  };

  const metrics = useMemo(
    () => [
      {
        label: "Total Tenants",
        value: String(tenants.length),
        icon: Building2,
        className: "bg-sky-100 text-sky-700",
      },
      {
        label: "Premium Tenants",
        value: String(tenants.filter((tenant) => tenant.plan === "premium").length),
        icon: Crown,
        className: "bg-amber-100 text-amber-700",
      },
      {
        label: "Pending Requests",
        value: String(requests.filter((request) => request.status === "pending").length),
        icon: Clock3,
        className: "bg-violet-100 text-violet-700",
      },
      {
        label: "Suspended Tenants",
        value: String(tenants.filter((tenant) => tenant.status === "suspended").length),
        icon: ShieldAlert,
        className: "bg-rose-100 text-rose-700",
      },
    ],
    [requests, tenants],
  );

  const handleReview = async (
    request: PlanRequestSummary,
    decision: "approved" | "rejected",
  ) => {
    setProcessingId(request.id);
    try {
      await reviewPremiumRequest({
        requestId: request.id,
        decision,
      });
      await refresh();
      setActionError("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to review request.");
    } finally {
      setProcessingId("");
    }
  };

  const handleTenantStatusChange = async (
    tenant: TenantSummary,
    status: TenantStatus,
  ) => {
    if (tenant.status === status) return;
    setProcessingTenantId(tenant.id);
    try {
      await updateTenantStatus({
        tenantId: tenant.id,
        status,
      });
      await refresh();
      setActionError("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update tenant status.");
    } finally {
      setProcessingTenantId("");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
          Platform Control
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Super Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Monitor tenants, review premium demand, and manage platform access.
        </p>
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
              <p className="text-3xl font-bold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-sm text-slate-600">{metric.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Tenants</h2>
              <p className="text-sm text-slate-600">Current platform accounts and plan status.</p>
            </div>
          </div>

          <div className="space-y-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{tenant.name}</p>
                    <p className="text-xs text-slate-500">{tenant.slug}</p>
                    <p className="mt-1 text-sm text-slate-600">{tenant.ownerEmail}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <span className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      {tenant.plan}
                    </span>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {tenant.status}
                    </div>
                  </div>
                </div>
                {tenant.requestedPlan ? (
                  <p className="mt-3 text-xs text-amber-700">
                    Requested plan: {tenant.requestedPlan}
                  </p>
                ) : null}
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tenant Status
                  </label>
                  <select
                    value={tenant.status}
                    onChange={(event) =>
                      handleTenantStatusChange(
                        tenant,
                        event.target.value as TenantStatus,
                      )
                    }
                    disabled={processingTenantId === tenant.id}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            ))}
            {tenants.length === 0 ? (
              <p className="text-sm text-slate-600">No tenants found.</p>
            ) : null}
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-950">Premium Requests</h2>
            <p className="text-sm text-slate-600">Tenant upgrade requests awaiting review.</p>
          </div>

          <div className="space-y-3">
            {requests.map((request) => {
              const pending = request.status === "pending";
              return (
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
                        {request.tenant?.slug ?? request.tenantId}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                        request.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : request.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{request.message || "No message."}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Requested by {request.requestedByEmail} for {request.requestedPlan}
                  </p>
                  {request.reviewedBy ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Reviewed by {request.reviewedBy}
                    </p>
                  ) : null}
                  {pending ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleReview(request, "approved")}
                        disabled={processingId === request.id}
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                      >
                        {processingId === request.id ? "Processing..." : "Approve Premium"}
                      </button>
                      <button
                        onClick={() => handleReview(request, "rejected")}
                        disabled={processingId === request.id}
                        className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:bg-slate-100"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
            {requests.length === 0 ? (
              <p className="text-sm text-slate-600">No premium requests found.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
