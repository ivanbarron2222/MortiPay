import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { getCurrentDemoUser, type DemoUserRole } from "../../lib/demo-users";

function getDefaultRouteForRole(role: DemoUserRole | null) {
  if (role === "super_admin") return "/super-admin";
  if (role === "tenant_admin") return "/admin";
  if (role === "tenant_user") return "/user";
  return "/";
}

export function RoleGate({ allowedRoles }: { allowedRoles: DemoUserRole[] }) {
  const [currentRole, setCurrentRole] = useState<DemoUserRole | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    void getCurrentDemoUser()
      .then((user) => {
        if (active) setCurrentRole(user?.role ?? null);
      })
      .catch(() => {
        if (active) setCurrentRole(null);
      });

    return () => {
      active = false;
    };
  }, []);

  if (currentRole === undefined) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-xl bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Checking session...
        </div>
      </div>
    );
  }

  if (!currentRole) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={getDefaultRouteForRole(currentRole)} replace />;
  }

  return <Outlet />;
}
