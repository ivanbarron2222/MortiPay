import { Outlet, useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { logoutDemoUser } from "../../lib/demo-users";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: FileText, label: "Loan Accounts", path: "/admin/loans" },
    { icon: Users, label: "User Accounts", path: "/admin/users" },
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 h-screen shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div
            className={`flex items-center mb-8 ${
              sidebarOpen ? "justify-between" : "justify-center"
            }`}
          >
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img
                  src="/noBG_mortipay.png"
                  alt="Morti Pay"
                  className="h-15 w-15 rounded-md object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-blue-600">
                    Morti Pay
                  </h1>
                  <p className="text-xs text-gray-600">Admin Portal</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <img
                src="/noBG_mortipay.png"
                alt="Morti Pay"
                className="h-10 w-10 rounded-md object-contain"
              />
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center rounded-lg transition-colors ${
                    sidebarOpen
                      ? "w-full px-4 py-3 justify-start"
                      : "w-12 h-12 mx-auto justify-center"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                logoutDemoUser();
                navigate("/");
              }}
              className={`flex items-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
                sidebarOpen
                  ? "w-full px-4 py-3 justify-start"
                  : "w-12 h-12 mx-auto justify-center"
              }`}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
