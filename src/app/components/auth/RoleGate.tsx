import { Navigate, Outlet } from "react-router";
import { getCurrentDemoUserRole, type DemoUserRole } from "../../lib/demo-users";

function getDefaultRouteForRole(role: DemoUserRole | null) {
  if (role === "super_admin") return "/super-admin";
  if (role === "tenant_admin") return "/admin";
  if (role === "tenant_user") return "/user";
  return "/";
}

export function RoleGate({ allowedRoles }: { allowedRoles: DemoUserRole[] }) {
  const currentRole = getCurrentDemoUserRole();

  if (!currentRole) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={getDefaultRouteForRole(currentRole)} replace />;
  }

  return <Outlet />;
}
