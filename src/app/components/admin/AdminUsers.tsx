import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import {
  createDemoUserWithLoan,
  getDemoUsers,
  type DemoUserAccount,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

type TermMonths = 12 | 24 | 36 | 48;

export function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    motorcycle: "",
    principalAmount: "65000",
    downpayment: "15000",
    annualInterestRate: "12",
    termMonths: "24",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = await getDemoUsers();
      if (active) setUsers(next.filter((user) => user.role === "user"));
    };
    load();
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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await createDemoUserWithLoan({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      motorcycle: form.motorcycle,
      principalAmount: Number(form.principalAmount),
      downpayment: Number(form.downpayment),
      annualInterestRate: Number(form.annualInterestRate),
      termMonths: Number(form.termMonths) as TermMonths,
    });

    if (created.error) {
      setError(created.error);
      return;
    }

    setError("");
    setForm({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      motorcycle: "",
      principalAmount: "65000",
      downpayment: "15000",
      annualInterestRate: "12",
      termMonths: "24",
    });
    const next = await getDemoUsers();
    setUsers(next.filter((user) => user.role === "user"));
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Accounts</h1>
        <p className="text-gray-600">
          Create user credentials and loan profile. Installments are auto-calculated.
        </p>
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create User Loan Account</h2>
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
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
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
            Create Account
          </button>
          {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
        </form>
      </Card>

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
          {filteredUsers.map((user: DemoUserAccount) => (
            <div key={user.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-600">
                    {user.id} • {user.email} • {user.phone}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700">
                  ACTIVE
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-600">No users found.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
