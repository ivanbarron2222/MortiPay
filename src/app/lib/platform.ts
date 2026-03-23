import { supabase } from "./supabase";
import { getActiveTenantSlug } from "./supabase";
import { getCurrentDemoUser } from "./demo-users";

export type TenantPlan = "free" | "premium";
export type TenantStatus = "pending" | "active" | "suspended" | "inactive";

export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  ownerEmail: string;
  status: TenantStatus;
  plan: TenantPlan;
  requestedPlan: TenantPlan | null;
  premiumRequestedAt: string | null;
  premiumReviewedAt: string | null;
  premiumReviewedBy: string | null;
  createdAt: string;
};

export type PlanRequestSummary = {
  id: string;
  tenantId: string;
  requestedByUserId: string;
  requestedByEmail: string;
  requestedPlan: "premium";
  status: "pending" | "approved" | "rejected";
  message: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  tenant: Pick<TenantSummary, "slug" | "name" | "plan" | "status"> | null;
};

type TenantRow = {
  id: string;
  slug: string;
  name: string;
  owner_email: string;
  status: TenantStatus;
  plan: TenantPlan;
  requested_plan: TenantPlan | null;
  premium_requested_at: string | null;
  premium_reviewed_at: string | null;
  premium_reviewed_by: string | null;
  created_at: string;
};

type PlanRequestRow = {
  id: string;
  tenant_id: string;
  requested_by_user_id: string;
  requested_by_email: string;
  requested_plan: "premium";
  status: "pending" | "approved" | "rejected";
  message: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  tenants?: {
    slug: string;
    name: string;
    plan: TenantPlan;
    status: TenantStatus;
  } | null;
};

function mapTenant(row: TenantRow): TenantSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerEmail: row.owner_email,
    status: row.status,
    plan: row.plan,
    requestedPlan: row.requested_plan,
    premiumRequestedAt: row.premium_requested_at,
    premiumReviewedAt: row.premium_reviewed_at,
    premiumReviewedBy: row.premium_reviewed_by,
    createdAt: row.created_at,
  };
}

function mapPlanRequest(row: PlanRequestRow): PlanRequestSummary {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requestedByUserId: row.requested_by_user_id,
    requestedByEmail: row.requested_by_email,
    requestedPlan: row.requested_plan,
    status: row.status,
    message: row.message,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    tenant: row.tenants
      ? {
          slug: row.tenants.slug,
          name: row.tenants.name,
          plan: row.tenants.plan,
          status: row.tenants.status,
        }
      : null,
  };
}

export async function getTenantSummaries(): Promise<TenantSummary[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch tenants. ${error.message}`);
  }

  return (data ?? []).map((row) => mapTenant(row as TenantRow));
}

export async function getPlanRequestSummaries(): Promise<PlanRequestSummary[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("plan_requests")
    .select(`
      *,
      tenants:tenant_id (
        slug,
        name,
        plan,
        status
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to fetch plan requests. ${error.message}`);
  }

  return (data ?? []).map((row) => mapPlanRequest(row as PlanRequestRow));
}

export async function getCurrentTenantSummary(): Promise<TenantSummary | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantSlug = getActiveTenantSlug();
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch current tenant. ${error.message}`);
  }

  return data ? mapTenant(data as TenantRow) : null;
}

export async function submitPremiumRequest(message: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const currentUser = await getCurrentDemoUser();
  if (!currentUser || currentUser.role !== "tenant_admin") {
    throw new Error("Only tenant admins can request premium.");
  }
  const { data, error } = await supabase.rpc("submit_premium_request", {
    request_message: message.trim(),
  });

  if (error) {
    throw new Error(`Unable to submit premium request. ${error.message}`);
  }
  const requests = await getPlanRequestSummaries();
  const created = requests.find((request) => request.id === (data as { id: string }).id);
  if (!created) {
    throw new Error("Premium request was created but could not be reloaded.");
  }
  return created;
}

export async function reviewPremiumRequest(params: {
  requestId: string;
  decision: "approved" | "rejected";
}) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const currentUser = await getCurrentDemoUser();
  if (!currentUser || currentUser.role !== "super_admin") {
    throw new Error("Only super admins can review premium requests.");
  }

  const { data, error } = await supabase.rpc("review_premium_request", {
    request_id: params.requestId,
    decision: params.decision,
  });

  if (error) {
    throw new Error(`Unable to review premium request. ${error.message}`);
  }
  const requests = await getPlanRequestSummaries();
  const reviewed = requests.find((request) => request.id === (data as { id: string }).id);
  if (!reviewed) {
    throw new Error("Premium request was reviewed but could not be reloaded.");
  }
  return reviewed;
}

export async function updateTenantStatus(params: {
  tenantId: string;
  status: TenantStatus;
}) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const currentUser = await getCurrentDemoUser();
  if (!currentUser || currentUser.role !== "super_admin") {
    throw new Error("Only super admins can update tenant status.");
  }

  const { data, error } = await supabase.rpc("update_tenant_status", {
    target_tenant_id: params.tenantId,
    next_status: params.status,
  });

  if (error) {
    throw new Error(`Unable to update tenant status. ${error.message}`);
  }

  return mapTenant(data as TenantRow);
}
