import { Outlet, useLocation, useNavigate } from "react-router";
import { Building2, LayoutDashboard, LogOut } from "lucide-react";
import { logoutDemoUser } from "../../lib/demo-users";

export function SuperAdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-slate-950 text-white">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20">
              <Building2 className="text-cyan-300" size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Platform
              </p>
              <h1 className="text-xl font-bold">Super Admin</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "text-slate-200 hover:bg-slate-800"
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
            className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-slate-200 transition-colors hover:bg-slate-800"
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
