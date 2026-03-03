import { clearActiveTenantSlug, getActiveTenantSlug, isSupabaseEnabled, setActiveTenantSlug, supabase } from "./supabase";

export type DemoUserRole = "admin" | "user";
export type DemoLocationPermissionState = PermissionState | "unknown";
export type DemoLocationMonitoringStatus =
  | "tracking"
  | "location_off"
  | "stale"
  | "no_data";

export type DemoLoanProfile = {
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

type DbUserRow = {
  tenant_id: string;
  id: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: DemoUserRole;
  created_at: string;
  loan_profile: DemoLoanProfile | null;
  location_tracking: DemoLocationTracking | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const SUPABASE_USERS_TABLE = "app_users";
const SUPABASE_TENANTS_TABLE = "tenants";
const SESSION_USER_ID_KEY = "mf_demo_session_user_id";
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

  const { data: inserted, error: insertError } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .insert({
      slug: tenantSlug,
      name: tenantSlugToName(tenantSlug) || "Demo Shop",
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Unable to create tenant in Supabase. ${insertError.message}`);
  }

  supabaseTenantIdCache = inserted.id as string;
  return supabaseTenantIdCache;
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

async function apiGetUsers(): Promise<DemoUserAccount[]> {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error("Unable to fetch users.");
  const users = (await response.json()) as DemoUserAccount[];
  return users.map(normalizeUser);
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

export function getCurrentDemoUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_USER_ID_KEY);
}

export function logoutDemoUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_USER_ID_KEY);
  clearActiveTenantSlug();
  clearSupabaseTenantCache();
}

export async function getDemoUsers(): Promise<DemoUserAccount[]> {
  return storeGetUsers();
}

export async function getCurrentDemoUser(): Promise<DemoUserAccount | null> {
  const currentId = getCurrentDemoUserId();
  if (!currentId) return null;
  const users = await getDemoUsers();
  return users.find((user) => user.id === currentId) ?? null;
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
  // Set the tenant before fetching so ensureSupabaseTenantId uses the right slug
  setActiveTenantSlug(normalizeTenantSlug(shopSlug));
  clearSupabaseTenantCache();

  const normalized = identifier.trim().toLowerCase();
  const users = await getDemoUsers();
  const user = users.find(
    (account) =>
      (account.email.toLowerCase() === normalized ||
        account.phone.toLowerCase() === normalized) &&
      account.password === password,
  );

  if (!user) {
    // Don't persist the slug if login failed
    clearActiveTenantSlug();
    clearSupabaseTenantCache();
    return null;
  }

  setCurrentDemoUserId(user.id);
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

  // Check if slug already taken
  const { data: existing } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return { user: null, error: `Shop code "${slug}" is already taken. Try a different shop name.` };

  // Check if owner email already registered
  const normalizedEmail = params.email.trim().toLowerCase();
  const { data: emailTaken } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .select("id")
    .eq("owner_email", normalizedEmail)
    .maybeSingle();
  if (emailTaken) return { user: null, error: "An account with this email already exists." };

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from(SUPABASE_TENANTS_TABLE)
    .insert({ slug, name: tenantSlugToName(slug), owner_email: normalizedEmail })
    .select("id")
    .single();
  if (tenantError) return { user: null, error: `Could not create shop: ${tenantError.message}` };

  // Create first admin user
  const adminUser: DemoUserAccount = {
    id: "ADM-001",
    fullName: params.ownerFullName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    password: params.password,
    role: "admin",
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
    role: "user",
    createdAt: new Date().toISOString(),
    locationTracking: getDefaultLocationTracking(),
  };

  const created = await storePostUser(user);
  setCurrentDemoUserId(created.id);
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
  const user: DemoUserAccount = {
    id: `USR-${suffix}`,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    phone: params.phone.trim(),
    password: params.password,
    role: "user",
    createdAt: new Date().toISOString(),
    locationTracking: getDefaultLocationTracking(),
    loanProfile: {
      motorcycle: params.motorcycle,
      principalAmount: Math.max(params.principalAmount, 0),
      downpayment: Math.max(params.downpayment, 0),
      annualInterestRate: params.annualInterestRate,
      termMonths: params.termMonths,
      monthlyInstallment: Number(monthlyInstallment.toFixed(2)),
      totalPayable: Number(totalPayable.toFixed(2)),
      startDate: new Date().toISOString(),
      paidInstallmentNumbers: [],
    },
  };

  const created = await storePostUser(user);
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
