import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  activateLegacyAccount,
  lookupLegacyAccountForActivation,
  type LegacyAccountActivationCandidate,
} from "../../lib/demo-users";

export function ActivateLegacyAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [candidate, setCandidate] = useState<LegacyAccountActivationCandidate | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: searchParams.get("email") ?? "",
    shopCode: searchParams.get("shop") ?? "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!form.email.trim()) return;
      try {
        const result = await lookupLegacyAccountForActivation({
          email: form.email,
          shopSlug: form.shopCode,
        });
        if (!active) return;
        setCandidate(result);
        setLookupError(result ? "" : "No legacy account was found for these details.");
      } catch (err) {
        if (!active) return;
        setLookupError(err instanceof Error ? err.message : "Unable to look up legacy account.");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [form.email, form.shopCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 6) {
      setLookupError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLookupError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await activateLegacyAccount({
      email: form.email,
      shopSlug: form.shopCode,
      password: form.password,
    });
    setSubmitting(false);

    if (result.error || !result.user) {
      setLookupError(result.error ?? "Unable to activate legacy account.");
      return;
    }

    if (result.user.role === "super_admin") {
      navigate("/super-admin");
      return;
    }

    navigate(result.user.role === "tenant_admin" ? "/admin" : "/user");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Activate Existing Account</h1>
          <p className="text-gray-600 mt-1">
            Link a legacy seeded account to the new secure login flow.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Code
            </label>
            <Input
              value={form.shopCode}
              onChange={(event) => setForm({ ...form, shopCode: event.target.value })}
              placeholder="Leave blank for super admin"
              className="w-full rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter your existing account email"
              className="w-full rounded-xl"
              required
            />
          </div>

          {candidate ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Found {candidate.role.replace("_", " ")} account for {candidate.displayName}.
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Create a new login password"
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
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              placeholder="Confirm your new password"
              className="w-full rounded-xl"
              required
            />
          </div>

          {lookupError ? <p className="text-sm text-red-600 text-center">{lookupError}</p> : null}

          <Button
            type="submit"
            disabled={submitting || !candidate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
          >
            {submitting ? "Activating..." : "Activate Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-700">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
