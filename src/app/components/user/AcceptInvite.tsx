import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  acceptTenantUserInvite,
  getTenantUserInviteByToken,
  type TenantUserInvite,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

export function AcceptInvite() {
  const navigate = useNavigate();
  const { token = "" } = useParams();
  const [invite, setInvite] = useState<TenantUserInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getTenantUserInviteByToken(token);
        if (!active) return;
        setInvite(next);
        setError(next ? "" : "Invite not found.");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load invite.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  const duePreview = useMemo(() => {
    if (!invite) return null;
    const monthlyRate = invite.annualInterestRate / 12 / 100;
    const totalInterest = invite.principalAmount * monthlyRate * invite.termMonths;
    const totalPayable = invite.principalAmount + totalInterest;
    return {
      monthly: totalPayable / invite.termMonths,
      totalPayable,
    };
  }, [invite]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invite) return;
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setInfo("");
    const result = await acceptTenantUserInvite({
      token: invite.token,
      password: form.password,
    });
    setSubmitting(false);

    if (result.error) {
      if (result.error.includes("confirm the email first")) {
        setError("");
        setInfo(result.error);
        return;
      }
      setError(result.error);
      return;
    }

    navigate("/user");
  };

  const expired =
    invite && (invite.status !== "pending" || new Date(invite.expiresAt).getTime() < Date.now());

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Accept Invite</h1>
          <p className="text-gray-600 mt-1">Create your account to access your tenant workspace.</p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600 text-center">Loading invite...</p>
        ) : invite ? (
          <>
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-gray-900">{invite.fullName}</p>
              <p className="text-gray-700">{invite.email}</p>
              <p className="text-gray-700">{invite.phone}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-700">
                <p>Motorcycle: {invite.motorcycle}</p>
                <p>Term: {invite.termMonths} months</p>
                <p>Principal: {formatPhpCurrency(invite.principalAmount)}</p>
                <p>
                  Monthly: {duePreview ? formatPhpCurrency(duePreview.monthly) : "-"}
                </p>
              </div>
            </div>

            {expired ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                This invite is no longer available.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Create your password"
                      className="w-full rounded-xl pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm({ ...form, confirmPassword: event.target.value })
                    }
                    placeholder="Confirm your password"
                    className="w-full rounded-xl"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
                >
                  {submitting ? "Creating account..." : "Activate Account"}
                </Button>
              </form>
            )}
          </>
        ) : (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {error && invite && !expired ? (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        ) : null}
        {info && invite && !expired ? (
          <p className="mt-4 text-sm text-blue-700 text-center">{info}</p>
        ) : null}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
