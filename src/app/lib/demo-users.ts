import {
  clearActiveTenantSlug,
  getActiveTenantSlug,
  isSupabaseEnabled,
  setActiveTenantSlug,
  supabase,
} from "./supabase";

export type DemoUserRole = "super_admin" | "tenant_admin" | "tenant_user";
export type DemoLocationPermissionState = PermissionState | "unknown";
export type DemoLocationMonitoringStatus =
  | "tracking"
  | "location_off"
  | "stale"
  | "no_data";

export type DemoLoanProfile = {
  loanAccountNumber?: string;
  motorcycle: string;
  principalAmount: number;
  downpayment: number;
  annualInterestRate: number;
  termMonths: 12 | 24 | 36 | 48;
  monthlyInstallment: number;
  totalPayable: number;
  startDate: string;
  paidInstallmentNumbers: number[];
};

export type LoanInstallmentItem = {
  installmentNumber: number;
  dueDate: string;
  paid: boolean;
  amount: number;
};

export type DemoUserAccount = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  authUserId?: string | null;
  password: string;
  role: DemoUserRole;
  createdAt: string;
  loanProfile?: DemoLoanProfile;
  locationTracking?: DemoLocationTracking;
};

export type DemoLocationTracking = {
  lastHeartbeatAt: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  locationEnabled: boolean;
  permissionState: DemoLocationPermissionState;
  lastError: string | null;
};

export type DemoLocationAlert = {
  status: DemoLocationMonitoringStatus;
  message: string;
  minutesSinceHeartbeat: number | null;
};

export type TenantUserInvite = {
  id: string;
  tenantId: string;
  token: string;
  fullName: string;
  email: string;
  phone: string;
  motorcycle: string;
  principalAmount: number;
  downpayment: number;
  annualInterestRate: number;
  termMonths: 12 | 24 | 36 | 48;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  acceptedAt: string | null;
  createdByUserId: string;
  createdAt: string;
};

export type LegacyAccountActivationCandidate = {
  role: DemoUserRole;
  tenantSlug: string | null;
  displayName: string;
};

type DbUserRow = {
  tenant_id: string;
  id: string;
  full_name: string;
  email: string;
  phone: string;
  auth_user_id?: string | null;
  password: string;
  role: DemoUserRole;
  created_at: string;
  loan_profile: DemoLoanProfile | null;
  location_tracking: DemoLocationTracking | null;
};

type DbPlatformAdminRow = {
  id: string;
  full_name: string;
  email: string;
  auth_user_id?: string | null;
  password: string;
  created_at: string;
};

type DbAuthenticatedUserRow = DbUserRow & {
  tenants?: {
    slug: string;
  } | null;
};

type DbInviteRow = {
  id: string;
  tenant_id: string;
  token: string;
  full_name: string;
  email: string;
  phone: string;
  motorcycle: string;
  principal_amount: number;
  downpayment: number;
  annual_interest_rate: number;
  term_months: 12 | 24 | 36 | 48;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_by_user_id: string;
  created_at: string;
};

type DbLegacyActivationRow = {
  account_role: DemoUserRole;
  tenant_slug: string | null;
  display_name: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const SUPABASE_USERS_TABLE = "app_users";
const SUPABASE_TENANTS_TABLE = "tenants";
const SUPABASE_PLATFORM_ADMINS_TABLE = "platform_admins";
const SUPABASE_INVITES_TABLE = "tenant_user_invites";
const SESSION_USER_ID_KEY = "mf_demo_session_user_id";
const SESSION_USER_ROLE_KEY = "mf_demo_session_user_role";
const PENDING_INVITE_TOKEN_KEY = "mf_pending_invite_token";
let supabaseTenantIdCache: string | null = null;

export function clearSupabaseTenantCache() {
  supabaseTenantIdCache = null;
}

export const LOCATION_STALE_AFTER_MINUTES = 5;

function normalizeTenantSlug(slug: string) {
  const compact = slug.trim().toLowerCase();
  if (!compact) return "demo-shop";
  return compact.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

function buildLoanAccountNumber(seed: string, tenantSlug?: string | null) {
  const tenantSegment = (tenantSlug ?? "morti")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "MORTI";
  const seedSegment = seed
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-6) || "000001";
  return `LN-${tenantSegment}-${seedSegment}`;
}

function tenantSlugToName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDefaultLocationTracking(): DemoLocationTracking {
  return {
    lastHeartbeatAt: null,
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    locationEnabled: false,
    permissionState: "unknown",
    lastError: null,
  };
}

function normalizeUser(user: DemoUserAccount): DemoUserAccount {
  const normalizedLoan = user.loanProfile
    ? {
      loanAccountNumber:
        user.loanProfile.loanAccountNumber ??
        buildLoanAccountNumber(user.id, getActiveTenantSlug()),
      ...user.loanProfile,
      paidInstallmentNumbers: user.loanProfile.paidInstallmentNumbers ?? [],
    }
    : undefined;

  return {
    ...user,
    loanProfile: normalizedLoan,
    locationTracking: {
      ...getDefaultLocationTracking(),
      ...(user.locationTracking ?? {}),
    },
  };
}

function fromDbRow(row: DbUserRow): DemoUserAccount {
  return normalizeUser({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    authUserId: row.auth_user_id ?? null,
    password: row.password,
    role: row.role,
    createdAt: row.created_at,
    loanProfile: row.loan_profile ?? undefined,
    locationTracking: row.location_tracking ?? undefined,
  });
}

function toDbInsert(user: DemoUserAccount, tenantId: string) {
  return {
    tenant_id: tenantId,
    id: user.id,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone,
    auth_user_id: user.authUserId ?? null,
    password: user.password,
    role: user.role,
    created_at: user.createdAt,
    loan_profile: user.loanProfile ?? null,
    location_tracking: user.locationTracking ?? getDefaultLocationTracking(),
  };
}

function toDbPatch(payload: Partial<DemoUserAccount>) {
  const next: Record<string, unknown> = {};
  if (payload.fullName !== undefined) next.full_name = payload.fullName;
  if (payload.email !== undefined) next.email = payload.email;
  if (payload.phone !== undefined) next.phone = payload.phone;
  if (payload.authUserId !== undefined) next.auth_user_id = payload.authUserId;
  if (payload.password !== undefined) next.password = payload.password;
  if (payload.role !== undefined) next.role = payload.role;
  if (payload.createdAt !== undefined) next.created_at = payload.createdAt;
  if (payload.loanProfile !== undefined) next.loan_profile = payload.loanProfile;
  if (payload.locationTracking !== undefined) {
    next.location_tracking = payload.locationTracking;
  }
  return next;
}

function minutesFromIso(iso: string) {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const diffMs = Date.now() - time;
  return Math.max(0, Math.floor(diffMs / 60000));
}

function mapInviteRow(row: DbInviteRow): TenantUserInvite {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    token: row.token,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    motorcycle: row.motorcycle,
    principalAmount: Number(row.principal_amount),
    downpayment: Number(row.downpayment),
    annualInterestRate: Number(row.annual_interest_rate),
    termMonths: row.term_months,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
  };
}

function buildLoanProfileFromInvite(invite: TenantUserInvite): DemoLoanProfile {
  const principal = Math.max(invite.principalAmount, 0);
  const rate = invite.annualInterestRate;
  const months = invite.termMonths;
  const monthlyRate = rate / 12 / 100;
  const totalInterest = principal * monthlyRate * months;
  const totalPayable = principal + totalInterest;
  const monthlyInstallment = totalPayable / months;

  return {
    loanAccountNumber: buildLoanAccountNumber(invite.id, getActiveTenantSlug()),
    motorcycle: invite.motorcycle,
    principalAmount: principal,
    downpayment: Math.max(invite.downpayment, 0),
    annualInterestRate: rate,
    termMonths: months,
    monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
    totalPayable: Number(totalPayable.toFixed(2)),
    startDate: getFirstInstallmentStartDateIso(invite.createdAt),
    paidInstallmentNumbers: [],
  };
}

function createInviteToken() {
  return `invite_${crypto.randomUUID().replace(/-/g, "")}`;
}

function getFirstInstallmentStartDateIso(baseDateIso?: string) {
  const startDate = baseDateIso ? new Date(baseDateIso) : new Date();
  startDate.setMonth(startDate.getMonth() + 1);
  return startDate.toISOString();
}

function mapLegacyActivationRow(
  row: DbLegacyActivationRow,
): LegacyAccountActivationCandidate {
  return {
    role: row.account_role,
    tenantSlug: row.tenant_slug,
    displayName: row.display_name,
  };
}

async function getAuthenticatedSupabaseUserId() {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function ensureSupabaseSessionAfterSignUp(params: {
  email: string;
  password: string;
}) {
  if (!supabase) throw new Error("Supabase is not configured.");

  const authUserId = await getAuthenticatedSupabaseUserId();
  if (authUserId) return authUserId;

  const signInResult = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (signInResult.error) {
    throw new Error(
      "Auth account created, but no active session is available. If email confirmation is enabled in Supabase Auth, confirm the email first or disable confirmation for bootstrap accounts.",
    );
  }

  const nextAuthUserId = await getAuthenticatedSupabaseUserId();
  if (!nextAuthUserId) {
    throw new Error(
      "Auth account exists, but the session could not be established. Check Supabase Auth confirmation settings.",
    );
  }

  return nextAuthUserId;
}

async function ensureSupabaseTenantId(): Promise<string> {
  if (supabaseTenantIdCache) return supabaseTenantIdCache;
  if (!supabase) throw new Error("Supabase is not configured.");

  const tenantSlug = normalizeTenantSlug(getActiveTenantSlug());
  const { data, error } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .select("id")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load tenant in Supabase. ${error.message}`);
  }

  if (data?.id) {
    supabaseTenantIdCache = data.id as string;
    return supabaseTenantIdCache;
  }
  throw new Error(
    `Tenant "${tenantSlug}" was not found. Register the shop first or use an existing shop code.`,
  );
}

async function supabaseGetUsers(): Promise<DemoUserAccount[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantId = await ensureSupabaseTenantId();

  const { data, error } = await supabase
    .from(SUPABASE_USERS_TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to fetch users from Supabase. ${error.message}`);
  return (data ?? []).map((row) => fromDbRow(row as DbUserRow));
}

async function supabasePatchUser(
  userId: string,
  payload: Partial<DemoUserAccount>,
): Promise<DemoUserAccount> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantId = await ensureSupabaseTenantId();

  const { data, error } = await supabase
    .from(SUPABASE_USERS_TABLE)
    .update(toDbPatch(payload))
    .eq("tenant_id", tenantId)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error(`Unable to update user in Supabase. ${error.message}`);
  return fromDbRow(data as DbUserRow);
}

async function supabasePostUser(payload: DemoUserAccount): Promise<DemoUserAccount> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantId = await ensureSupabaseTenantId();

  const { data, error } = await supabase
    .from(SUPABASE_USERS_TABLE)
    .insert(toDbInsert(payload, tenantId))
    .select("*")
    .single();

  if (error) throw new Error(`Unable to create user in Supabase. ${error.message}`);
  return fromDbRow(data as DbUserRow);
}

async function supabaseGetInvites(): Promise<TenantUserInvite[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantId = await ensureSupabaseTenantId();

  const { data, error } = await supabase
    .from(SUPABASE_INVITES_TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Unable to fetch invites from Supabase. ${error.message}`);
  return (data ?? []).map((row) => mapInviteRow(row as DbInviteRow));
}

async function supabaseGetInviteByToken(token: string): Promise<TenantUserInvite | null> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase.rpc("get_public_invite_by_token", {
    invite_token: token,
  });

  if (error) throw new Error(`Unable to fetch invite. ${error.message}`);
  const row = Array.isArray(data) ? data[0] : null;
  return row ? mapInviteRow(row as DbInviteRow) : null;
}

async function supabaseGetInviteTenantSlug(token: string): Promise<string | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_invite_tenant_slug", {
    invite_token: token,
  });

  if (error) throw new Error(`Unable to resolve invite tenant. ${error.message}`);
  return typeof data === "string" ? data : null;
}

async function supabaseCreateInvite(payload: {
  fullName: string;
  email: string;
  phone: string;
  motorcycle: string;
  principalAmount: number;
  downpayment: number;
  annualInterestRate: number;
  termMonths: 12 | 24 | 36 | 48;
}): Promise<TenantUserInvite> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const tenantId = await ensureSupabaseTenantId();
  const currentUserId = getCurrentDemoUserId();
  if (!currentUserId) {
    throw new Error("No active tenant admin session.");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from(SUPABASE_INVITES_TABLE)
    .insert({
      tenant_id: tenantId,
      token: createInviteToken(),
      full_name: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      motorcycle: payload.motorcycle.trim(),
      principal_amount: Math.max(payload.principalAmount, 0),
      downpayment: Math.max(payload.downpayment, 0),
      annual_interest_rate: payload.annualInterestRate,
      term_months: payload.termMonths,
      status: "pending",
      expires_at: expiresAt.toISOString(),
      created_by_user_id: currentUserId,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Unable to create invite. ${error.message}`);
  return mapInviteRow(data as DbInviteRow);
}

async function supabaseLookupLegacyAccountForActivation(params: {
  email: string;
  shopSlug: string;
}): Promise<LegacyAccountActivationCandidate | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_legacy_account_for_activation", {
    account_email: params.email.trim().toLowerCase(),
    shop_slug: params.shopSlug.trim() || null,
  });

  if (error) {
    throw new Error(`Unable to look up legacy account. ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : null;
  return row ? mapLegacyActivationRow(row as DbLegacyActivationRow) : null;
}

async function supabaseActivateLegacyAccount(params: {
  email: string;
  shopSlug: string;
  password: string;
}): Promise<DemoUserAccount> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedShopSlug = normalizeTenantSlug(params.shopSlug);

  const { data: authResult, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: params.password,
  });
  if (authError) {
    throw new Error(`Could not create auth account: ${authError.message}`);
  }

  const authUserId =
    authResult.user?.id ?? (await ensureSupabaseSessionAfterSignUp({
      email: normalizedEmail,
      password: params.password,
    }));

  const { error: activationError } = await supabase.rpc("activate_legacy_account", {
    shop_slug: params.shopSlug.trim() ? normalizedShopSlug : null,
  });
  if (activationError) {
    await supabase.auth.signOut();
    throw new Error(`Could not activate legacy account: ${activationError.message}`);
  }

  if (params.shopSlug.trim()) {
    setActiveTenantSlug(normalizedShopSlug);
    clearSupabaseTenantCache();
  } else {
    clearActiveTenantSlug();
    clearSupabaseTenantCache();
  }

  const account = await resolveSupabaseAuthenticatedAccount();
  if (!account) {
    throw new Error("Legacy account was activated but the session could not be resolved.");
  }

  setCurrentDemoUserId(account.id);
  setCurrentDemoUserRole(account.role);
  return {
    ...account,
    authUserId: authUserId ?? account.authUserId ?? null,
  };
}

async function apiGetUsers(): Promise<DemoUserAccount[]> {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error("Unable to fetch users.");
  const users = (await response.json()) as DemoUserAccount[];
  return users.map(normalizeUser);
}

async function supabaseAuthenticatePlatformAdmin(
  identifier: string,
  password: string,
): Promise<DemoUserAccount | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const normalized = identifier.trim().toLowerCase();
  const { data, error } = await supabase
    .from(SUPABASE_PLATFORM_ADMINS_TABLE)
    .select("*")
    .eq("email", normalized)
    .eq("password", password)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to authenticate platform admin. ${error.message}`);
  }

  if (!data) return null;

  const admin = data as DbPlatformAdminRow;
  return {
    id: admin.id,
    fullName: admin.full_name,
    email: admin.email,
    phone: "",
    authUserId: admin.auth_user_id ?? null,
    password: admin.password,
    role: "super_admin",
    createdAt: admin.created_at,
    locationTracking: getDefaultLocationTracking(),
  };
}

async function supabaseGetPlatformAdminById(
  userId: string,
): Promise<DemoUserAccount | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from(SUPABASE_PLATFORM_ADMINS_TABLE)
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load platform admin. ${error.message}`);
  }

  if (!data) return null;

  const admin = data as DbPlatformAdminRow;
  return {
    id: admin.id,
    fullName: admin.full_name,
    email: admin.email,
    phone: "",
    authUserId: admin.auth_user_id ?? null,
    password: admin.password,
    role: "super_admin",
    createdAt: admin.created_at,
    locationTracking: getDefaultLocationTracking(),
  };
}

async function resolveSupabaseAuthenticatedAccount(): Promise<DemoUserAccount | null> {
  if (!supabase) return null;
  const authUserId = await getAuthenticatedSupabaseUserId();
  if (!authUserId) return null;

  const { data: platformAdmin, error: platformError } = await supabase
    .from(SUPABASE_PLATFORM_ADMINS_TABLE)
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (platformError) {
    throw new Error(`Unable to resolve platform admin session. ${platformError.message}`);
  }

  if (platformAdmin) {
    const admin = platformAdmin as DbPlatformAdminRow;
    return {
      id: admin.id,
      fullName: admin.full_name,
      email: admin.email,
      phone: "",
      authUserId: admin.auth_user_id ?? authUserId,
      password: admin.password,
      role: "super_admin",
      createdAt: admin.created_at,
      locationTracking: getDefaultLocationTracking(),
    };
  }

  const { data: appUser, error: appUserError } = await supabase
    .from(SUPABASE_USERS_TABLE)
    .select(`
      *,
      tenants (
        slug
      )
    `)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (appUserError) {
    throw new Error(`Unable to resolve tenant user session. ${appUserError.message}`);
  }

  if (!appUser) return null;

  const row = appUser as DbAuthenticatedUserRow;
  const account = fromDbRow(row);
  const tenantSlug = row.tenants?.slug;
  if (tenantSlug) {
    setActiveTenantSlug(tenantSlug);
    clearSupabaseTenantCache();
  }
  return account;
}

async function finalizePendingInviteIfPossible(): Promise<void> {
  if (!supabase) return;
  const pendingToken = getPendingInviteToken();
  if (!pendingToken) return;

  const authUserId = await getAuthenticatedSupabaseUserId();
  if (!authUserId) return;

  const existingAccount = await resolveSupabaseAuthenticatedAccount();
  if (existingAccount) {
    clearPendingInviteToken();
    return;
  }

  const { error } = await supabase.rpc("accept_tenant_user_invite", {
    invite_token: pendingToken,
    invite_password: "",
  });

  if (!error) {
    clearPendingInviteToken();
  }
}

async function apiPatchUser(
  userId: string,
  payload: Partial<DemoUserAccount>,
): Promise<DemoUserAccount> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Unable to update user.");
  return normalizeUser((await response.json()) as DemoUserAccount);
}

async function apiPostUser(payload: DemoUserAccount): Promise<DemoUserAccount> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Unable to create user.");
  return normalizeUser((await response.json()) as DemoUserAccount);
}

async function storeGetUsers(): Promise<DemoUserAccount[]> {
  if (isSupabaseEnabled()) return supabaseGetUsers();
  return apiGetUsers();
}

async function storePatchUser(
  userId: string,
  payload: Partial<DemoUserAccount>,
): Promise<DemoUserAccount> {
  if (isSupabaseEnabled()) return supabasePatchUser(userId, payload);
  return apiPatchUser(userId, payload);
}

async function storePostUser(payload: DemoUserAccount): Promise<DemoUserAccount> {
  if (isSupabaseEnabled()) return supabasePostUser(payload);
  return apiPostUser(payload);
}

export function setCurrentDemoUserId(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_USER_ID_KEY, userId);
}

export function setCurrentDemoUserRole(role: DemoUserRole) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_USER_ROLE_KEY, role);
}

export function getCurrentDemoUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_USER_ID_KEY);
}

export function getCurrentDemoUserRole(): DemoUserRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(SESSION_USER_ROLE_KEY);
  if (
    role === "super_admin" ||
    role === "tenant_admin" ||
    role === "tenant_user"
  ) {
    return role;
  }
  return null;
}

export function logoutDemoUser() {
  if (supabase) {
    void supabase.auth.signOut();
  }
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_USER_ID_KEY);
  window.localStorage.removeItem(SESSION_USER_ROLE_KEY);
  clearActiveTenantSlug();
  clearSupabaseTenantCache();
}

function setPendingInviteToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
}

function getPendingInviteToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PENDING_INVITE_TOKEN_KEY);
}

function clearPendingInviteToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}

export async function getDemoUsers(): Promise<DemoUserAccount[]> {
  return storeGetUsers();
}

export async function getTenantUserInvites(): Promise<TenantUserInvite[]> {
  if (!isSupabaseEnabled()) return [];
  return supabaseGetInvites();
}

export async function getTenantUserInviteByToken(token: string) {
  if (!isSupabaseEnabled()) return null;
  return supabaseGetInviteByToken(token);
}

export async function lookupLegacyAccountForActivation(params: {
  email: string;
  shopSlug: string;
}) {
  if (!isSupabaseEnabled()) return null;
  return supabaseLookupLegacyAccountForActivation(params);
}

export async function activateLegacyAccount(params: {
  email: string;
  shopSlug: string;
  password: string;
}) {
  if (!isSupabaseEnabled()) {
    return { user: null, error: "Supabase is not configured." };
  }

  try {
    const user = await supabaseActivateLegacyAccount(params);
    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Unable to activate legacy account.",
    };
  }
}

export async function getCurrentDemoUser(): Promise<DemoUserAccount | null> {
  if (isSupabaseEnabled()) {
    await finalizePendingInviteIfPossible();
    const authenticated = await resolveSupabaseAuthenticatedAccount();
    if (authenticated) {
      setCurrentDemoUserId(authenticated.id);
      setCurrentDemoUserRole(authenticated.role);
      return authenticated;
    }
  }

  const currentId = getCurrentDemoUserId();
  if (!currentId) return null;
  const currentRole = getCurrentDemoUserRole();
  if (currentRole === "super_admin") {
    if (!isSupabaseEnabled()) return null;
    return supabaseGetPlatformAdminById(currentId);
  }
  const users = await getDemoUsers();
  return users.find((user) => user.id === currentId) ?? null;
}

export async function hydrateCurrentDemoSession() {
  const user = await getCurrentDemoUser();
  if (user) return user;

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_USER_ID_KEY);
    window.localStorage.removeItem(SESSION_USER_ROLE_KEY);
  }
  return null;
}

export function evaluateDemoUserLocationAlert(
  user: DemoUserAccount,
  staleAfterMinutes = LOCATION_STALE_AFTER_MINUTES,
): DemoLocationAlert {
  const tracking = {
    ...getDefaultLocationTracking(),
    ...(user.locationTracking ?? {}),
  };

  if (!tracking.lastHeartbeatAt) {
    const explicitOff =
      tracking.permissionState === "denied" ||
      (!tracking.locationEnabled && Boolean(tracking.lastError));
    return {
      status: explicitOff ? "location_off" : "no_data",
      minutesSinceHeartbeat: null,
      message: explicitOff
        ? tracking.lastError ?? "Location permission is off."
        : "No location heartbeat received yet.",
    };
  }

  const minutesSinceHeartbeat = minutesFromIso(tracking.lastHeartbeatAt);
  if (!tracking.locationEnabled || tracking.permissionState === "denied") {
    return {
      status: "location_off",
      minutesSinceHeartbeat,
      message: tracking.lastError ?? "Location permission is off.",
    };
  }

  if (minutesSinceHeartbeat !== null && minutesSinceHeartbeat > staleAfterMinutes) {
    return {
      status: "stale",
      minutesSinceHeartbeat,
      message: `No location heartbeat for ${minutesSinceHeartbeat} minute(s).`,
    };
  }

  return {
    status: "tracking",
    minutesSinceHeartbeat,
    message: "Location tracking is active.",
  };
}

export async function authenticateDemoUser(
  identifier: string,
  password: string,
  shopSlug: string,
) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const normalizedShopSlug = normalizeTenantSlug(shopSlug);

  if (isSupabaseEnabled() && supabase) {
    if (!normalizedIdentifier.includes("@")) {
      return null;
    }

    if (shopSlug.trim()) {
      setActiveTenantSlug(normalizedShopSlug);
      clearSupabaseTenantCache();
    } else {
      clearActiveTenantSlug();
      clearSupabaseTenantCache();
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedIdentifier,
      password,
    });

    if (!error) {
      await finalizePendingInviteIfPossible();
      const authenticated = await resolveSupabaseAuthenticatedAccount();
      if (authenticated) {
        if (
          authenticated.role === "super_admin" &&
          shopSlug.trim()
        ) {
          await supabase.auth.signOut();
          clearActiveTenantSlug();
          clearSupabaseTenantCache();
          return null;
        }

        if (
          authenticated.role !== "super_admin" &&
          shopSlug.trim() &&
          normalizedShopSlug !== normalizeTenantSlug(getActiveTenantSlug())
        ) {
          await supabase.auth.signOut();
          clearActiveTenantSlug();
          clearSupabaseTenantCache();
          return null;
        }

        setCurrentDemoUserId(authenticated.id);
        setCurrentDemoUserRole(authenticated.role);
        return authenticated;
      }
    }
  }

  if (!shopSlug.trim()) {
    clearActiveTenantSlug();
    clearSupabaseTenantCache();
    const platformAdmin = isSupabaseEnabled()
      ? await supabaseAuthenticatePlatformAdmin(normalizedIdentifier, password)
      : null;

    if (!platformAdmin) return null;
    setCurrentDemoUserId(platformAdmin.id);
    setCurrentDemoUserRole(platformAdmin.role);
    return platformAdmin;
  }

  // Set the tenant before fetching so ensureSupabaseTenantId uses the right slug
  setActiveTenantSlug(normalizedShopSlug);
  clearSupabaseTenantCache();

  const users = await getDemoUsers();
  const user = users.find(
    (account) =>
      (account.email.toLowerCase() === normalizedIdentifier ||
        account.phone.toLowerCase() === normalizedIdentifier) &&
      account.password === password,
  );

  if (!user) {
    // Don't persist the slug if login failed
    clearActiveTenantSlug();
    clearSupabaseTenantCache();
    return null;
  }

  setCurrentDemoUserId(user.id);
  setCurrentDemoUserRole(user.role);
  return user;
}

export async function registerShop(params: {
  shopName: string;
  ownerFullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: DemoUserAccount | null; error: string | null }> {
  if (!supabase) return { user: null, error: "Supabase is not configured." };

  const slug = normalizeTenantSlug(params.shopName);
  if (!slug) return { user: null, error: "Shop name is invalid." };
  const normalizedEmail = params.email.trim().toLowerCase();

  const { data: authResult, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: params.password,
  });
  if (authError) {
    return { user: null, error: `Could not create auth account: ${authError.message}` };
  }

  const authUserId =
    authResult.user?.id ?? (await ensureSupabaseSessionAfterSignUp({
      email: normalizedEmail,
      password: params.password,
    }));

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .insert({ slug, name: tenantSlugToName(slug), owner_email: normalizedEmail })
    .select("id")
    .single();
  if (tenantError) {
    await supabase.auth.signOut();
    const message =
      tenantError.message.includes("tenants_slug_key")
        ? `Shop code "${slug}" is already taken. Try a different shop name.`
        : tenantError.message.includes("tenants_owner_email_idx")
          ? "An account with this email already exists."
          : `Could not create shop: ${tenantError.message}`;
    return { user: null, error: message };
  }

  // Create first admin user
  const adminUser: DemoUserAccount = {
    id: "ADM-001",
    fullName: params.ownerFullName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    authUserId,
    password: params.password,
    role: "tenant_admin",
    createdAt: new Date().toISOString(),
    locationTracking: getDefaultLocationTracking(),
  };

  const { data: insertedUser, error: userError } = await supabase
    .from(SUPABASE_USERS_TABLE)
    .insert(toDbInsert(adminUser, tenant.id as string))
    .select("*")
    .single();

  if (userError) {
    // Roll back tenant on failure
    await supabase.from(SUPABASE_TENANTS_TABLE).delete().eq("id", tenant.id);
    return { user: null, error: `Could not create admin account: ${userError.message}` };
  }

  // Set session
  setActiveTenantSlug(slug);
  clearSupabaseTenantCache();
  const created = fromDbRow(insertedUser as DbUserRow);
  setCurrentDemoUserId(created.id);
  setCurrentDemoUserRole(created.role);
  return { user: created, error: null };
}

export async function registerDemoUser(params: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const users = await getDemoUsers();
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedPhone = params.phone.trim().toLowerCase();

  const emailExists = users.some(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
  if (emailExists) return { user: null, error: "Email already registered." };

  const phoneExists = users.some(
    (user) => user.phone.toLowerCase() === normalizedPhone,
  );
  if (phoneExists) return { user: null, error: "Phone number already registered." };

  const suffix = String(users.length + 1).padStart(3, "0");
  const user: DemoUserAccount = {
    id: `USR-${suffix}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    password: params.password,
    role: "tenant_user",
    createdAt: new Date().toISOString(),
    locationTracking: getDefaultLocationTracking(),
  };

  if (isSupabaseEnabled() && supabase) {
    const { data: authResult, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: params.password,
    });
    if (authError) {
      return { user: null, error: `Could not create auth account: ${authError.message}` };
    }
    user.authUserId =
      authResult.user?.id ?? (await ensureSupabaseSessionAfterSignUp({
        email: normalizedEmail,
        password: params.password,
      }));
  }

  const created = await storePostUser(user);
  setCurrentDemoUserId(created.id);
  setCurrentDemoUserRole(created.role);
  return { user: created, error: null };
}

export async function createDemoUserWithLoan(params: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  motorcycle: string;
  principalAmount: number;
  downpayment: number;
  annualInterestRate: number;
  termMonths: 12 | 24 | 36 | 48;
}) {
  if (isSupabaseEnabled()) {
    const existingUsers = await getDemoUsers();
    const invites = await getTenantUserInvites();
    const normalizedEmail = params.email.trim().toLowerCase();
    const normalizedPhone = params.phone.trim().toLowerCase();

    const emailExists = existingUsers.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    ) || invites.some((invite) => invite.email.toLowerCase() === normalizedEmail && invite.status === "pending");
    if (emailExists) return { user: null, error: "Email already registered or invited." };

    const phoneExists = existingUsers.some(
      (user) => user.phone.toLowerCase() === normalizedPhone,
    ) || invites.some((invite) => invite.phone.toLowerCase() === normalizedPhone && invite.status === "pending");
    if (phoneExists) return { user: null, error: "Phone number already registered or invited." };

    await supabaseCreateInvite({
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      motorcycle: params.motorcycle,
      principalAmount: params.principalAmount,
      downpayment: params.downpayment,
      annualInterestRate: params.annualInterestRate,
      termMonths: params.termMonths,
    });
    return { user: null, error: null };
  }

  const users = await getDemoUsers();
  const normalizedEmail = params.email.trim().toLowerCase();
  const normalizedPhone = params.phone.trim().toLowerCase();

  const emailExists = users.some(
    (user) => user.email.toLowerCase() === normalizedEmail,
  );
  if (emailExists) return { user: null, error: "Email already registered." };

  const phoneExists = users.some(
    (user) => user.phone.toLowerCase() === normalizedPhone,
  );
  if (phoneExists) return { user: null, error: "Phone number already registered." };

  const monthlyRate = params.annualInterestRate / 12 / 100;
  const totalInterest = params.principalAmount * monthlyRate * params.termMonths;
  const totalPayable = params.principalAmount + totalInterest;
  const monthlyInstallment = totalPayable / params.termMonths;

  const suffix = String(users.length + 1).padStart(3, "0");
  const nextLoanSequence = String(
    users.filter((user) => user.role === "tenant_user").length + 1,
  ).padStart(4, "0");
  const user: DemoUserAccount = {
    id: `USR-${suffix}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    password: params.password,
    role: "tenant_user",
    createdAt: new Date().toISOString(),
    locationTracking: getDefaultLocationTracking(),
    loanProfile: {
      loanAccountNumber: buildLoanAccountNumber(nextLoanSequence, getActiveTenantSlug()),
      motorcycle: params.motorcycle,
      principalAmount: Math.max(params.principalAmount, 0),
      downpayment: Math.max(params.downpayment, 0),
      annualInterestRate: params.annualInterestRate,
      termMonths: params.termMonths,
      monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
      totalPayable: Number(totalPayable.toFixed(2)),
      startDate: getFirstInstallmentStartDateIso(),
      paidInstallmentNumbers: [],
    },
  };

  const created = await storePostUser(user);
  return { user: created, error: null };
}

export async function acceptTenantUserInvite(params: {
  token: string;
  password: string;
}) {
  if (!supabase) {
    return { user: null, error: "Supabase is not configured." };
  }

  const invite = await supabaseGetInviteByToken(params.token);
  if (!invite) {
    return { user: null, error: "Invite not found." };
  }
  if (invite.status !== "pending") {
    return { user: null, error: "This invite is no longer available." };
  }
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    await supabase
      .from(SUPABASE_INVITES_TABLE)
      .update({ status: "expired" })
      .eq("id", invite.id);
    return { user: null, error: "This invite has expired." };
  }

  const tenantSlug = await supabaseGetInviteTenantSlug(invite.token);
  if (!tenantSlug) {
    return { user: null, error: "Unable to resolve tenant for this invite." };
  }

  setActiveTenantSlug(tenantSlug);
  clearSupabaseTenantCache();

  const { data: authResult, error: authError } = await supabase.auth.signUp({
    email: invite.email,
    password: params.password,
  });
  if (authError) {
    return { user: null, error: `Could not create auth account: ${authError.message}` };
  }

  const authUserId =
    authResult.user?.id ??
    (await ensureSupabaseSessionAfterSignUp({
      email: invite.email,
      password: params.password,
    }).catch(() => null));

  if (!authUserId) {
    setPendingInviteToken(invite.token);
    return {
      user: null,
      error:
        "Auth account created. If email confirmation is enabled, confirm the email first, then log in normally to finish invite activation.",
    };
  }

  const { data: createdRow, error: acceptError } = await supabase.rpc("accept_tenant_user_invite", {
    invite_token: invite.token,
    invite_password: params.password,
  });
  if (acceptError) {
    return {
      user: null,
      error: `Could not finish invite activation: ${acceptError.message}`,
    };
  }

  const created = fromDbRow(createdRow as DbUserRow);
  clearPendingInviteToken();

  setCurrentDemoUserId(created.id);
  setCurrentDemoUserRole(created.role);
  return { user: created, error: null };
}

export async function updateCurrentDemoUserProfile(params: {
  fullName: string;
  phone: string;
}) {
  const currentId = getCurrentDemoUserId();
  if (!currentId) return { user: null, error: "No active session." };

  const users = await getDemoUsers();
  const normalizedPhone = params.phone.trim().toLowerCase();
  const phoneExists = users.some(
    (user) => user.id !== currentId && user.phone.toLowerCase() === normalizedPhone,
  );
  if (phoneExists) return { user: null, error: "Phone number already registered." };

  const updated = await storePatchUser(currentId, {
    fullName: params.fullName.trim(),
    phone: params.phone.trim(),
  });
  return { user: updated, error: null };
}

export async function changeCurrentDemoUserPassword(params: {
  currentPassword: string;
  newPassword: string;
}) {
  const currentId = getCurrentDemoUserId();
  if (!currentId) return { success: false, error: "No active session." };

  const users = await getDemoUsers();
  const currentUser = users.find((user) => user.id === currentId);
  if (!currentUser) return { success: false, error: "User not found." };
  if (currentUser.password !== params.currentPassword) {
    return { success: false, error: "Current password is incorrect." };
  }

  if (isSupabaseEnabled() && supabase) {
    const { error } = await supabase.auth.updateUser({
      password: params.newPassword,
    });
    if (error) {
      return { success: false, error: error.message };
    }
  }

  await storePatchUser(currentId, { password: params.newPassword });
  return { success: true, error: null };
}

export function getLoanInstallmentSchedule(
  loanProfile: DemoLoanProfile,
): LoanInstallmentItem[] {
  const start = new Date(loanProfile.startDate);
  const paidInstallmentNumbers = loanProfile.paidInstallmentNumbers ?? [];
  return Array.from({ length: loanProfile.termMonths }).map((_, index) => {
    const installmentNumber = index + 1;
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + index);
    return {
      installmentNumber,
      dueDate: dueDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      paid: paidInstallmentNumbers.includes(installmentNumber),
      amount: loanProfile.monthlyInstallment,
    };
  });
}

export async function setDemoUserInstallmentPaid(
  userId: string,
  installmentNumber: number,
  paid: boolean,
) {
  const users = await getDemoUsers();
  const user = users.find((item) => item.id === userId);
  if (!user?.loanProfile) return users;
  const current = user.loanProfile.paidInstallmentNumbers ?? [];
  const next = paid
    ? Array.from(new Set([...current, installmentNumber])).sort((a, b) => a - b)
    : current.filter((value) => value !== installmentNumber);

  const updatedUser = await storePatchUser(userId, {
    loanProfile: { ...user.loanProfile, paidInstallmentNumbers: next },
  });
  return users.map((item) => (item.id === userId ? updatedUser : item));
}

export async function setDemoUserLoanStartDate(userId: string, startDateIso: string) {
  const users = await getDemoUsers();
  const user = users.find((item) => item.id === userId);
  if (!user?.loanProfile) return users;
  const updatedUser = await storePatchUser(userId, {
    loanProfile: { ...user.loanProfile, startDate: startDateIso },
  });
  return users.map((item) => (item.id === userId ? updatedUser : item));
}

export async function updateCurrentDemoUserLocation(
  payload: Partial<DemoLocationTracking>,
) {
  const currentId = getCurrentDemoUserId();
  if (!currentId) return { user: null, error: "No active session." };
  const users = await getDemoUsers();
  const currentUser = users.find((user) => user.id === currentId);
  if (!currentUser) return { user: null, error: "User not found." };

  const updatedTracking: DemoLocationTracking = {
    ...getDefaultLocationTracking(),
    ...(currentUser.locationTracking ?? {}),
    ...payload,
  };

  const updated = await storePatchUser(currentId, {
    locationTracking: updatedTracking,
  });
  return { user: updated, error: null };
}

export function getDemoStorageKey() {
  return `supabase:${normalizeTenantSlug(getActiveTenantSlug())}`;
}

export function getDemoApiBaseUrl() {
  if (isSupabaseEnabled()) {
    return `${import.meta.env.VITE_SUPABASE_URL ?? "Supabase"} (${normalizeTenantSlug(
      getActiveTenantSlug(),
    )})`;
  }
  return API_BASE_URL;
}
