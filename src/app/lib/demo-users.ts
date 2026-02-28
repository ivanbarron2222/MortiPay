export type DemoUserRole = "admin" | "user";

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
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const USERS_KEY = "mf_demo_users";
const SESSION_USER_ID_KEY = "mf_demo_session_user_id";

function normalizeUser(user: DemoUserAccount): DemoUserAccount {
  if (!user.loanProfile) return user;
  return {
    ...user,
    loanProfile: {
      ...user.loanProfile,
      paidInstallmentNumbers: user.loanProfile.paidInstallmentNumbers ?? [],
    },
  };
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
}

export async function getDemoUsers(): Promise<DemoUserAccount[]> {
  return apiGetUsers();
}

export async function getCurrentDemoUser(): Promise<DemoUserAccount | null> {
  const currentId = getCurrentDemoUserId();
  if (!currentId) return null;
  const users = await getDemoUsers();
  return users.find((user) => user.id === currentId) ?? null;
}

export async function authenticateDemoUser(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  const users = await getDemoUsers();
  const user = users.find(
    (account) =>
      (account.email.toLowerCase() === normalized ||
        account.phone.toLowerCase() === normalized) &&
      account.password === password,
  );

  if (!user) return null;
  setCurrentDemoUserId(user.id);
  return user;
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

  const created = await apiPostUser(user);
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

  const updated = await apiPatchUser(currentId, {
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

  await apiPatchUser(currentId, { password: params.newPassword });
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

  const updatedUser = await apiPatchUser(userId, {
    loanProfile: { ...user.loanProfile, paidInstallmentNumbers: next },
  });
  return users.map((item) => (item.id === userId ? updatedUser : item));
}

export async function setDemoUserLoanStartDate(userId: string, startDateIso: string) {
  const users = await getDemoUsers();
  const user = users.find((item) => item.id === userId);
  if (!user?.loanProfile) return users;
  const updatedUser = await apiPatchUser(userId, {
    loanProfile: { ...user.loanProfile, startDate: startDateIso },
  });
  return users.map((item) => (item.id === userId ? updatedUser : item));
}

export function getDemoStorageKey() {
  return USERS_KEY;
}

export function getDemoApiBaseUrl() {
  return API_BASE_URL;
}
