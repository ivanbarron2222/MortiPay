import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search, Link2, Lock } from "lucide-react";
import {
  createDemoUserWithLoan,
  evaluateDemoUserLocationAlert,
  getDemoUsers,
  getTenantUserInvites,
  type DemoUserAccount,
  type TenantUserInvite,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";
import { isSupabaseEnabled } from "../../lib/supabase";
import { getCurrentTenantSummary, type TenantSummary } from "../../lib/platform";

type TermMonths = 12 | 24 | 36 | 48;

export function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  const [invites, setInvites] = useState<TenantUserInvite[]>([]);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    motorcycle: "",
    principalAmount: "65000",
    downpayment: "15000",
    annualInterestRate: "12",
    termMonths: "24",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextUsers, nextInvites, nextTenant] = await Promise.all([
        getDemoUsers(),
        getTenantUserInvites(),
        getCurrentTenantSummary(),
      ]);
      if (!active) return;
      setUsers(nextUsers.filter((user) => user.role === "tenant_user"));
      setInvites(nextInvites);
      setTenant(nextTenant);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const preview = useMemo(() => {
    const principal = Number(form.principalAmount) || 0;
    const rate = Number(form.annualInterestRate) || 0;
    const months = Number(form.termMonths) || 1;
    const monthlyRate = rate / 12 / 100;
    const totalInterest = principal * monthlyRate * months;
    const totalPayable = principal + totalInterest;
    const monthly = totalPayable / months;
    return { monthly, totalPayable };
  }, [form.annualInterestRate, form.principalAmount, form.termMonths]);

  const pendingInvites = invites.filter((invite) => invite.status === "pending");
  const isPremium = tenant?.plan === "premium";

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await createDemoUserWithLoan({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: "invite-flow",
      motorcycle: form.motorcycle,
      principalAmount: Number(form.principalAmount),
      downpayment: Number(form.downpayment),
      annualInterestRate: Number(form.annualInterestRate),
      termMonths: Number(form.termMonths) as TermMonths,
    });

    if (created.error) {
      setSuccess("");
      setError(created.error);
      return;
    }

    setError("");
    setSuccess(
      isSupabaseEnabled()
        ? "Invite created. Share the activation link below with the tenant user."
        : "User account created.",
    );
    setForm({
      fullName: "",
      email: "",
      phone: "",
      motorcycle: "",
      principalAmount: "65000",
      downpayment: "15000",
      annualInterestRate: "12",
      termMonths: "24",
    });

    const [nextUsers, nextInvites] = await Promise.all([
      getDemoUsers(),
      getTenantUserInvites(),
    ]);
    setUsers(nextUsers.filter((user) => user.role === "tenant_user"));
    setInvites(nextInvites);
  };

  const getGoogleMapsUrl = (latitude: number, longitude: number) =>
    `https://www.google.com/maps?q=${latitude},${longitude}`;

  const getInviteUrl = (token: string) =>
    `${window.location.origin}/accept-invite/${token}`;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Accounts</h1>
        <p className="text-gray-600">
          {isSupabaseEnabled()
            ? "Invite tenant users, then let them activate their own account securely."
            : "Create user credentials and loan profile. Installments are auto-calculated."}
        </p>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {isSupabaseEnabled() ? "Create Tenant User Invite" : "Create User Loan Account"}
        </h2>
        {isSupabaseEnabled() ? (
          <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            The tenant user will receive an invite link, set their own password, and then get a
            real authenticated account tied to this tenant.
          </p>
        ) : null}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Full Name"
            value={form.fullName}
            onChange={(event) => setForm({ ...form, fullName: event.target.value })}
            required
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            required
          />
          <Input
            placeholder="Motorcycle (e.g. Honda Click 125i)"
            value={form.motorcycle}
            onChange={(event) => setForm({ ...form, motorcycle: event.target.value })}
            required
          />
          <Input
            placeholder="Principal Amount"
            type="number"
            min={0}
            value={form.principalAmount}
            onChange={(event) => setForm({ ...form, principalAmount: event.target.value })}
            required
          />
          <Input
            placeholder="Downpayment"
            type="number"
            min={0}
            value={form.downpayment}
            onChange={(event) => setForm({ ...form, downpayment: event.target.value })}
            required
          />
          <Input
            placeholder="Annual Interest Rate (%)"
            type="number"
            min={0}
            step="0.1"
            value={form.annualInterestRate}
            onChange={(event) => setForm({ ...form, annualInterestRate: event.target.value })}
            required
          />
          <select
            className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.termMonths}
            onChange={(event) => setForm({ ...form, termMonths: event.target.value })}
          >
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="48">48 months</option>
          </select>
          <div className="rounded-md border px-3 py-2 text-sm bg-blue-50">
            Est. Monthly:{" "}
            <span className="font-semibold">{formatPhpCurrency(preview.monthly)}</span>
          </div>
          <div className="rounded-md border px-3 py-2 text-sm bg-blue-50">
            Total Payable:{" "}
            <span className="font-semibold">{formatPhpCurrency(preview.totalPayable)}</span>
          </div>
          <button className="md:col-span-2 h-10 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">
            {isSupabaseEnabled() ? "Create Invite" : "Create Account"}
          </button>
          {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="md:col-span-2 text-sm text-green-600">{success}</p> : null}
        </form>
      </Card>

      {isSupabaseEnabled() ? (
        <Card className="p-6 rounded-xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Invites</h2>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{invite.fullName}</p>
                    <p className="text-xs text-gray-600">
                      {invite.email} - {invite.phone}
                    </p>
                  </div>
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    PENDING
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  {invite.motorcycle} - {invite.termMonths} months
                </p>
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                    <Link2 size={14} />
                    Activation Link
                  </div>
                  <p className="mt-2 break-all text-xs text-blue-700">
                    {getInviteUrl(invite.token)}
                  </p>
                </div>
              </div>
            ))}
            {pendingInvites.length === 0 ? (
              <p className="text-sm text-gray-600">No pending invites.</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card className="p-6 rounded-xl">
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const locationAlert = evaluateDemoUserLocationAlert(user);
            const statusLabel = isPremium
              ? locationAlert.status === "tracking"
                ? "GPS TRACKING"
                : locationAlert.status === "stale"
                  ? "GPS STALE"
                  : locationAlert.status === "location_off"
                    ? "GPS OFF"
                    : "GPS NO DATA"
              : "PREMIUM ONLY";
            const statusClass = isPremium
              ? locationAlert.status === "tracking"
                ? "bg-green-100 text-green-700"
                : locationAlert.status === "no_data"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-700";

            return (
              <div key={user.id} className="rounded-lg border p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-600">
                      {user.id} - {user.email} - {user.phone}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <p>Loan No.: {user.loanProfile?.loanAccountNumber ?? "-"}</p>
                  <p>Motorcycle: {user.loanProfile?.motorcycle ?? "-"}</p>
                  <p>Term: {user.loanProfile?.termMonths ?? "-"} months</p>
                  <p>
                    Monthly:{" "}
                    {user.loanProfile
                      ? formatPhpCurrency(user.loanProfile.monthlyInstallment)
                      : "-"}
                  </p>
                  <p>
                    Total:{" "}
                    {user.loanProfile
                      ? formatPhpCurrency(user.loanProfile.totalPayable)
                      : "-"}
                  </p>
                  {isPremium ? (
                    <>
                      <p className="col-span-2 text-xs text-gray-600">
                        Last GPS heartbeat: {user.locationTracking?.lastHeartbeatAt ?? "none"}
                      </p>
                      <p className="col-span-2 text-xs text-gray-600">
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
                          className="col-span-2 text-xs text-blue-700 underline"
                        >
                          Open in Google Maps
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <div className="col-span-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Lock size={12} />
                        Premium Only
                      </div>
                      Advanced location heartbeat details and map links are available only on
                      premium.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-600">No users found.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
