import { Outlet, useLocation, useNavigate } from "react-router";
import { Crown, LayoutDashboard, LogOut, Store } from "lucide-react";
import { logoutDemoUser } from "../../lib/demo-users";

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin" },
    { icon: Store, label: "Tenants", path: "/super-admin/tenants" },
    { icon: Crown, label: "Premium Requests", path: "/super-admin/premium-requests" },
  ];

  return (
    <div className="min-h-screen bg-blue-50 flex">
      <aside className="sticky top-0 h-screen w-72 shrink-0 border-r border-blue-800 bg-blue-900 text-white">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
              <img
                src="/noBG_mortipay.png"
                alt="Morti Pay"
                className="h-11 w-11 object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-200">
                Platform
              </p>
              <h1 className="text-xl font-bold">Super Admin</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/super-admin"
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-green-400 text-blue-950"
                      : "text-blue-100 hover:bg-blue-800"
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => {
              logoutDemoUser();
              navigate("/");
            }}
            className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-blue-100 transition-colors hover:bg-blue-800"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
