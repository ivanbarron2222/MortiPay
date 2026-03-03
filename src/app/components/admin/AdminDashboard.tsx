import { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/card";
import { Users, FileText, CreditCard } from "lucide-react";
import {
  evaluateDemoUserLocationAlert,
  getDemoUsers,
  type DemoUserAccount,
} from "../../lib/demo-users";
import { formatPhpCurrency } from "../../lib/financing";

export function AdminDashboard() {
  const [users, setUsers] = useState<DemoUserAccount[]>([]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = await getDemoUsers();
      if (active) setUsers(next.filter((user) => user.role === "user"));
    };
    load();
    return () => {
      active = false;
    };
  }, []);
  const withLoans = users.filter((user) => user.loanProfile);
  const locationAlerts = useMemo(
    () =>
      users
        .map((user) => ({
          user,
          alert: evaluateDemoUserLocationAlert(user),
        }))
        .filter(
          (entry) =>
            entry.alert.status === "location_off" || entry.alert.status === "stale",
        ),
    [users],
  );

  const totalReceivable = withLoans.reduce(
    (sum, user) => sum + (user.loanProfile?.totalPayable ?? 0),
    0,
  );

  const stats = [
    {
      title: "Total User Accounts",
      value: String(users.length),
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Loan Accounts Created",
      value: String(withLoans.length),
      icon: FileText,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Receivable",
      value: formatPhpCurrency(totalReceivable),
      icon: CreditCard,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Location Alerts",
      value: String(locationAlerts.length),
      icon: Users,
      color: "bg-red-100 text-red-600",
    },
  ];

  const getGoogleMapsUrl = (latitude: number, longitude: number) =>
    `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Admin-managed account creation with automatic installment breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Loan Accounts</h2>
        <div className="space-y-3">
          {withLoans.slice(0, 5).map((user) => (
            <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-600">
                {user.loanProfile?.motorcycle} • {user.loanProfile?.termMonths} months
              </p>
              <p className="text-sm text-gray-900 mt-1">
                Monthly: {formatPhpCurrency(user.loanProfile?.monthlyInstallment ?? 0)}
              </p>
            </div>
          ))}
          {withLoans.length === 0 ? (
            <p className="text-sm text-gray-600">No loan accounts yet.</p>
          ) : null}
        </div>
      </Card>

      <Card className="p-6 rounded-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Location Monitoring Alerts</h2>
        <div className="space-y-3">
          {locationAlerts.map(({ user, alert }) => (
            <div key={user.id} className="p-4 rounded-lg border border-red-200 bg-red-50">
              <p className="font-semibold text-gray-900">
                {user.fullName} ({user.id})
              </p>
              <p className="text-sm text-red-700 mt-1">{alert.message}</p>
              <p className="text-xs text-gray-600 mt-1">
                Last heartbeat: {user.locationTracking?.lastHeartbeatAt ?? "none"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Latitude:{" "}
                {typeof user.locationTracking?.latitude === "number"
                  ? user.locationTracking.latitude.toFixed(6)
                  : "none"}{" "}
                | Longitude:{" "}
                {typeof user.locationTracking?.longitude === "number"
                  ? user.locationTracking.longitude.toFixed(6)
                  : "none"}
              </p>
              {typeof user.locationTracking?.latitude === "number" &&
              typeof user.locationTracking?.longitude === "number" ? (
                <a
                  href={getGoogleMapsUrl(
                    user.locationTracking.latitude,
                    user.locationTracking.longitude,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-700 underline mt-1 inline-block"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          ))}
          {locationAlerts.length === 0 ? (
            <p className="text-sm text-gray-600">All users have active location heartbeat.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
