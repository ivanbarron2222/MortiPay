import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, Bell, HelpCircle, Bike, UserRound } from "lucide-react";

export function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/user" },
    { icon: Bike, label: "Catalog", path: "/user/catalog" },
    { icon: Bell, label: "Reminders", path: "/user/reminders" },
    { icon: HelpCircle, label: "Support", path: "/user/support" },
    { icon: UserRound, label: "Account", path: "/user/account" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-[390px] mx-auto">
      {/* Main Content */}
      <div className="flex-1 pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-[390px] mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const isActive =
              item.path === "/user"
                ? location.pathname === "/user"
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
