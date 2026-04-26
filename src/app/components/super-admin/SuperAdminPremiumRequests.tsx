import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Crown, Search, XCircle } from "lucide-react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import {
  getPlanRequestSummaries,
  reviewPremiumRequest,
  type PlanRequestSummary,
} from "../../lib/platform";

type RequestStatusFilter = "pending" | "approved" | "rejected" | "all";

const statusFilters: RequestStatusFilter[] = ["pending", "approved", "rejected", "all"];

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function requestStatusClass(status: PlanRequestSummary["status"]) {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-blue-100 text-blue-700";
}

function requestIcon(status: PlanRequestSummary["status"]) {
  if (status === "approved") return CheckCircle2;
  if (status === "rejected") return XCircle;
  return Clock3;
}

export function SuperAdminPremiumRequests() {
  const [requests, setRequests] = useState<PlanRequestSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const requestRows = await getPlanRequestSummaries();
      setRequests(requestRows);
      setSelectedRequestId((current) => current || requestRows[0]?.id || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load premium requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        request.requestedByEmail.toLowerCase().includes(normalizedQuery) ||
        (request.tenant?.name.toLowerCase().includes(normalizedQuery) ?? false) ||
        (request.tenant?.slug.toLowerCase().includes(normalizedQuery) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [query, requests, statusFilter]);

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ??
    filteredRequests[0] ??
    null;

  const counts = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "pending").length,
      approved: requests.filter((request) => request.status === "approved").length,
      rejected: requests.filter((request) => request.status === "rejected").length,
      all: requests.length,
    }),
    [requests],
  );

  const handleReview = async (
    request: PlanRequestSummary,
    decision: "approved" | "rejected",
  ) => {
    setProcessingId(request.id);
    setActionError("");
    try {
      await reviewPremiumRequest({
        requestId: request.id,
        decision,
      });
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to review request.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Upgrade Workflow
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Premium Requests
          </h1>
          <p className="mt-2 text-slate-600">
            Review tenant upgrade requests separately from tenant account management.
          </p>
        </div>
        <Card className="rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-100 p-3 text-green-700">
              <Crown size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-950">{counts.pending}</p>
              <p className="text-xs text-slate-500">Pending review</p>
            </div>
          </div>
        </Card>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="rounded-2xl p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize ${
                    statusFilter === status
                      ? "bg-blue-700 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {status} ({counts[status]})
                </button>
              ))}
            </div>
            <div className="relative min-w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tenant or requester"
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(220px,1fr)_140px_130px_170px] bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Tenant</span>
              <span>Current Plan</span>
              <span>Status</span>
              <span>Requested</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {filteredRequests.map((request) => {
                const Icon = requestIcon(request.status);
                const selected = selectedRequest?.id === request.id;
                return (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`grid w-full grid-cols-[minmax(220px,1fr)_140px_130px_170px] items-center px-4 py-4 text-left text-sm transition-colors ${
                      selected ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold text-slate-950">
                        {request.tenant?.name ?? "Unknown Tenant"}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {request.tenant?.slug ?? request.tenantId}
                      </span>
                    </span>
                    <span className="capitalize text-slate-700">
                      {request.tenant?.plan ?? "-"}
                    </span>
                    <span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${requestStatusClass(
                          request.status,
                        )}`}
                      >
                        <Icon size={12} />
                        {request.status}
                      </span>
                    </span>
                    <span className="text-slate-600">{formatDateTime(request.createdAt)}</span>
                  </button>
                );
              })}
              {!loading && filteredRequests.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No premium requests match the current filters.
                </div>
              ) : null}
              {loading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading premium requests...
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-6">
          {selectedRequest ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-green-100 p-3 text-green-700">
                  <Crown size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    {selectedRequest.tenant?.name ?? "Unknown Tenant"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedRequest.tenant?.slug ?? selectedRequest.tenantId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Plan
                  </p>
                  <p className="mt-2 text-lg font-bold capitalize text-slate-950">
                    {selectedRequest.tenant?.plan ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested
                  </p>
                  <p className="mt-2 text-lg font-bold capitalize text-slate-950">
                    {selectedRequest.requestedPlan}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Request Message
                </p>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {selectedRequest.message || "No message provided."}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested By
                  </p>
                  <p className="mt-1 text-slate-800">{selectedRequest.requestedByEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requested At
                  </p>
                  <p className="mt-1 text-slate-800">{formatDateTime(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Review Status
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${requestStatusClass(
                      selectedRequest.status,
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                {selectedRequest.reviewedBy ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewed
                    </p>
                    <p className="mt-1 text-slate-800">
                      {selectedRequest.reviewedBy} -{" "}
                      {formatDateTime(selectedRequest.reviewedAt)}
                    </p>
                  </div>
                ) : null}
              </div>

              {selectedRequest.status === "pending" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReview(selectedRequest, "rejected")}
                    disabled={processingId === selectedRequest.id}
                    className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-300 disabled:bg-slate-100"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReview(selectedRequest, "approved")}
                    disabled={processingId === selectedRequest.id}
                    className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
                  >
                    {processingId === selectedRequest.id ? "Processing..." : "Approve Premium"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a request to view details.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
