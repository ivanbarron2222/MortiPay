import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Store } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  authenticateDemoUser,
  getDemoApiBaseUrl,
  logoutDemoUser,
  updateCurrentDemoUserLocation,
} from "../../lib/demo-users";
import { ensureLocationAccess } from "../../lib/location-monitoring";
import { isSupabaseEnabled } from "../../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const userAppOnly = import.meta.env.VITE_USER_APP_ONLY === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [shopCode, setShopCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const apiBaseUrl = getDemoApiBaseUrl();
  const supabaseEnabled = isSupabaseEnabled();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authenticated = await authenticateDemoUser(
        identifier,
        password,
        shopCode,
      );
      if (!authenticated) {
        setError(
          supabaseEnabled
            ? "Invalid email, password, or shop code. Please check your details and try again."
            : "Invalid credentials or shop code. Please check your details and try again.",
        );
        return;
      }

      if (authenticated.role === "tenant_user") {
        const locationCheck = await ensureLocationAccess();
        if (!locationCheck.ok) {
          await updateCurrentDemoUserLocation({
            locationEnabled: false,
            permissionState: locationCheck.off.permissionState,
            lastError: locationCheck.off.reason,
          });
          logoutDemoUser();
          setError(
            "Location access is required. Please enable GPS permission and login again.",
          );
          return;
        }

        await updateCurrentDemoUserLocation({
          lastHeartbeatAt: locationCheck.heartbeat.capturedAt,
          latitude: locationCheck.heartbeat.latitude,
          longitude: locationCheck.heartbeat.longitude,
          accuracyMeters: locationCheck.heartbeat.accuracyMeters,
          locationEnabled: true,
          permissionState: locationCheck.heartbeat.permissionState,
          lastError: null,
        });
      }

      setError("");
      if (!userAppOnly && authenticated.role === "super_admin") {
        navigate("/super-admin");
        return;
      }

      navigate(
        !userAppOnly && authenticated.role === "tenant_admin" ? "/admin" : "/user",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown network error";
      setError(`Cannot connect to demo API (${apiBaseUrl}). ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Morti Pay</h1>
          <p className="text-gray-600 mt-2">Monitoring Real-Time Installment Payments</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shop Code
            </label>
            <div className="relative">
              <Store
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                placeholder="e.g. demo-shop (leave blank for super admin)"
                className="w-full rounded-xl pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {supabaseEnabled ? "Email Address" : "Email / Phone Number"}
            </label>
            <Input
              type={supabaseEnabled ? "email" : "text"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={supabaseEnabled ? "Enter email" : "Enter email or phone"}
              className="w-full rounded-xl"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot Password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>

          {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Own a motorcycle shop?{" "}
            <Link
              to="/register-shop"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Register your shop {"->"}
            </Link>
          </p>
          {supabaseEnabled ? (
            <p className="text-gray-600 text-sm mt-2">
              Using an older seeded account?{" "}
              <Link
                to={`/activate-account?email=${encodeURIComponent(identifier)}&shop=${encodeURIComponent(shopCode)}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Activate existing account
              </Link>
            </p>
          ) : null}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-800 text-center font-medium mb-1">
            Demo Accounts
          </p>
          <p className="text-xs text-blue-800 text-center">
            <strong>demo-shop</strong> {"->"} admin@motopay.ph / admin123
          </p>
          <p className="text-xs text-blue-800 text-center">
            <strong>wheeltek-sample</strong> {"->"} owner@wheeltek-sample.ph / wheeltek123
          </p>
          <p className="text-xs text-blue-800 text-center">
            <strong>super admin</strong> {"->"} superadmin@mortipay.ph / super123
          </p>
          <p className="text-[10px] text-blue-700 text-center mt-1">
            API: {apiBaseUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
