import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { Card } from "../ui/card";
import { getCurrentDemoUser, logoutDemoUser } from "../../lib/demo-users";
import { getCurrentTenantSummary } from "../../lib/platform";

type GateState =
  | { status: "loading" }
  | { status: "allowed" }
  | { status: "redirect" }
  | {
      status: "blocked";
      tenantStatus: "pending" | "suspended" | "inactive";
    };

export function TenantAccessGate() {
  const navigate = useNavigate();
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const currentUser = await getCurrentDemoUser();
      if (!active) return;

      if (!currentUser || currentUser.role === "super_admin") {
        setState({ status: "redirect" });
        return;
      }

      const tenant = await getCurrentTenantSummary();
      if (!active) return;

      if (!tenant) {
        setState({ status: "redirect" });
        return;
      }

      if (tenant.status === "active") {
        setState({ status: "allowed" });
        return;
      }

      setState({
        status: "blocked",
        tenantStatus: tenant.status,
      });
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <Card className="rounded-2xl p-6 text-sm text-slate-600">Checking tenant access...</Card>
      </div>
    );
  }

  if (state.status === "redirect") {
    return <Navigate to="/" replace />;
  }

  if (state.status === "allowed") {
    return <Outlet />;
  }

  const message =
    state.tenantStatus === "pending"
      ? "Your tenant account is still pending approval. Access will unlock once the platform approves your tenant."
      : state.tenantStatus === "suspended"
        ? "Your tenant account is currently suspended. Contact the platform super admin to restore access."
        : "Your tenant account is inactive. Login is blocked until the platform reactivates the tenant.";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <Card className="max-w-xl rounded-3xl p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Tenant Access Restricted
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">
          {state.tenantStatus === "pending"
            ? "Tenant approval required"
            : state.tenantStatus === "suspended"
              ? "Tenant is suspended"
              : "Tenant is inactive"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Login
          </button>
          <button
            onClick={() => {
              logoutDemoUser();
              navigate("/");
            }}
            className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Logout
          </button>
        </div>
      </Card>
    </div>
  );
}
