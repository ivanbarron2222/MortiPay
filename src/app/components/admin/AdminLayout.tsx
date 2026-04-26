import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  BarChart3,
  Crown,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentDemoUser, logoutDemoUser } from "../../lib/demo-users";
import {
  getCurrentTenantSummary,
  getPlanRequestSummaries,
  submitPremiumRequest,
  type TenantSummary,
} from "../../lib/platform";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import { AdminAIAssistant } from "./AdminAIAssistant";

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState(
    "We want advanced monitoring and premium reporting for our tenant.",
  );
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState("");

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: FileText, label: "Loan Accounts", path: "/admin/loans" },
    { icon: Users, label: "User Accounts", path: "/admin/users" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  ];

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [nextTenant, currentUser] = await Promise.all([
        getCurrentTenantSummary(),
        getCurrentDemoUser(),
      ]);
      if (!active) return;
      setTenant(nextTenant);

      if (!nextTenant || !currentUser) return;
      const storageKey = `mf_tenant_plan_modal_seen:${nextTenant.id}:${currentUser.id}`;
      if (!window.localStorage.getItem(storageKey)) {
        setShowPlanDialog(true);
        window.localStorage.setItem(storageKey, "true");
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const isPremium = tenant?.plan === "premium";
  const hasPendingPremiumRequest = tenant?.requestedPlan === "premium";
  const planBadgeClass = isPremium
    ? "bg-amber-100 text-amber-800 border-amber-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
  const planLabel = useMemo(
    () => (isPremium ? "Premium" : tenant ? "Free" : "Plan"),
    [isPremium, tenant],
  );

  const handlePremiumRequest = async () => {
    setUpgradeLoading(true);
    try {
      await submitPremiumRequest(upgradeMessage);
      const [nextTenant] = await Promise.all([
        getCurrentTenantSummary(),
        getPlanRequestSummaries(),
      ]);
      setTenant(nextTenant);
      setUpgradeError("");
      setUpgradeSuccess("Premium request submitted. Super admin review is now pending.");
    } catch (err) {
      setUpgradeSuccess("");
      setUpgradeError(err instanceof Error ? err.message : "Unable to submit premium request.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={`sticky top-0 h-screen shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className={`flex h-full flex-col ${sidebarOpen ? "p-6" : "p-4"}`}>
          <div
            className={`mb-8 flex items-center ${
              sidebarOpen ? "justify-between" : "flex-col justify-center gap-3"
            }`}
          >
            {sidebarOpen ? (
              <div className="flex items-center gap-3">
                <img
                  src="/noBG_mortipay.png"
                  alt="Morti Pay"
                  className="h-15 w-15 rounded-md object-contain"
                />
                <div>
                  <p className="text-xs text-gray-600">Tenant Admin Portal</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src="/noBG_mortipay.png"
                  alt="Morti Pay"
                  className="h-10 w-10 rounded-md object-contain"
                />
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center rounded-lg transition-colors ${
                    sidebarOpen
                      ? "w-full justify-start px-4 py-3"
                      : "h-12 w-12 justify-center"
                  } ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen ? <span className="ml-3 font-medium">{item.label}</span> : null}
                </button>
              );
            })}
          </nav>

          {!isPremium && tenant ? (
            <div className="mt-4">
              <button
                onClick={() => {
                  setUpgradeError("");
                  setUpgradeSuccess("");
                  setShowUpgradeDialog(true);
                }}
                className={`flex items-center rounded-lg transition-colors ${
                  sidebarOpen
                    ? "w-full justify-start bg-blue-50 px-4 py-3 text-blue-700 hover:bg-blue-100"
                    : "h-12 w-12 justify-center bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
                title={hasPendingPremiumRequest ? "Premium Pending" : "Upgrade to Premium"}
              >
                <Sparkles size={20} className="flex-shrink-0" />
                {sidebarOpen ? (
                  <span className="ml-3 font-medium">
                    {hasPendingPremiumRequest ? "Premium Pending" : "Upgrade to Premium"}
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
            {tenant ? (
              <div
                className={`flex items-center rounded-lg border ${planBadgeClass} ${
                  sidebarOpen
                    ? "w-full justify-start px-4 py-3"
                    : "h-12 w-12 justify-center"
                }`}
                title={`${planLabel} Plan`}
              >
                <Crown size={18} className="flex-shrink-0" />
                {sidebarOpen ? (
                  <div className="ml-3 leading-tight">
                    <p className="text-[11px] font-medium uppercase tracking-wide opacity-75">
                      Current Plan
                    </p>
                    <p className="text-sm font-semibold">{planLabel}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={() => {
                logoutDemoUser();
                navigate("/");
              }}
              className={`flex items-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 ${
                sidebarOpen
                  ? "w-full justify-start px-4 py-3"
                  : "h-12 w-12 justify-center"
              }`}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {sidebarOpen ? <span className="ml-3 font-medium">Logout</span> : null}
            </button>
          </div>
        </div>
      </aside>

      <main className="h-screen flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {isPremium && tenant ? <AdminAIAssistant tenant={tenant} /> : null}

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-0 p-0">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-3">
                <Sparkles size={20} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {isPremium ? "Premium Tenant Workspace" : "Welcome to Your Tenant Plan"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-blue-50">
                  {tenant?.name ?? "Your tenant"} is currently on the{" "}
                  <span className="font-semibold text-white">{planLabel}</span> plan.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-white px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Free Features</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li>Tenant dashboard and financing overview</li>
                  <li>Loan account and user management</li>
                  <li>Basic collections tracking</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Premium Features</p>
                <ul className="mt-3 space-y-2 text-sm text-amber-800">
                  <li>Advanced reports with PDF and Excel exports</li>
                  <li>Portfolio aging, forecasts, and risk segmentation</li>
                  <li>Advanced location monitoring and premium insights</li>
                </ul>
              </div>
            </div>

            {!isPremium ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                Premium access is request-based. Use the sidebar upgrade action when you are ready.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Premium access is active. Your reports and advanced monitoring modules are ready
                to use.
              </div>
            )}

            <DialogFooter className="sm:justify-between">
              <button
                onClick={() => setShowPlanDialog(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setShowPlanDialog(false);
                  navigate(isPremium ? "/admin/reports" : "/admin");
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {isPremium ? "Open Reports" : "Open Dashboard"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-2xl overflow-hidden rounded-2xl border-0 p-0">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 px-6 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-3">
                <Sparkles size={20} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Request Premium Upgrade</DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-200">
                  Send your premium access request to the super admin from this modal.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="space-y-5 bg-white px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">Current Plan</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{planLabel}</p>
                <p className="mt-2 text-sm text-gray-600">
                  Request status:{" "}
                  {hasPendingPremiumRequest ? "Pending super admin review" : "Not requested"}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Premium Unlocks</p>
                <ul className="mt-3 space-y-2 text-sm text-amber-800">
                  <li>Advanced reports with PDF and Excel exports</li>
                  <li>Portfolio aging, forecasts, and risk segmentation</li>
                  <li>Advanced location monitoring and premium insights</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Premium request message
              </label>
              <textarea
                value={upgradeMessage}
                onChange={(event) => setUpgradeMessage(event.target.value)}
                className="min-h-32 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-0"
              />
            </div>

            {upgradeError ? <p className="text-sm text-red-600">{upgradeError}</p> : null}
            {upgradeSuccess ? <p className="text-sm text-green-600">{upgradeSuccess}</p> : null}

            <DialogFooter className="sm:justify-between">
              <button
                onClick={() => setShowUpgradeDialog(false)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handlePremiumRequest}
                disabled={upgradeLoading || hasPendingPremiumRequest}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {hasPendingPremiumRequest
                  ? "Premium Request Pending"
                  : upgradeLoading
                    ? "Submitting..."
                    : "Request Premium"}
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
