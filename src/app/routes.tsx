import { createBrowserRouter, type RouteObject } from "react-router";
import { NotFound } from "./components/NotFound";
import { RoleGate } from "./components/auth/RoleGate";
import { TenantAccessGate } from "./components/auth/TenantAccessGate";

const userAppOnly = import.meta.env.VITE_USER_APP_ONLY === "true";

const routes: RouteObject[] = [
  {
    path: "/",
    lazy: async () => ({
      Component: (await import("./components/user/Login")).Login,
    }),
  },
  {
    path: "/register-shop",
    lazy: async () => ({
      Component: (await import("./components/user/RegisterShop")).RegisterShop,
    }),
  },
  {
    path: "/accept-invite/:token",
    lazy: async () => ({
      Component: (await import("./components/user/AcceptInvite")).AcceptInvite,
    }),
  },
  {
    element: <RoleGate allowedRoles={["tenant_user"]} />,
    children: [
      {
        element: <TenantAccessGate />,
        children: [
          {
            path: "/user",
            lazy: async () => ({
              Component: (await import("./components/user/UserLayout")).UserLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("./components/user/Home")).Home,
                }),
              },
              {
                path: "catalog",
                lazy: async () => ({
                  Component: (await import("./components/user/Catalog")).Catalog,
                }),
              },
              {
                path: "catalog/:id",
                lazy: async () => ({
                  Component: (await import("./components/user/CatalogDetails"))
                    .CatalogDetails,
                }),
              },
              {
                path: "reminders",
                lazy: async () => ({
                  Component: (await import("./components/user/Reminders")).Reminders,
                }),
              },
              {
                path: "support",
                lazy: async () => ({
                  Component: (await import("./components/user/Support")).Support,
                }),
              },
              {
                path: "offers",
                lazy: async () => ({
                  Component: (await import("./components/user/Offers")).Offers,
                }),
              },
              {
                path: "loan-details",
                lazy: async () => ({
                  Component: (await import("./components/user/LoanDetails")).LoanDetails,
                }),
              },
              {
                path: "account",
                lazy: async () => ({
                  Component: (await import("./components/user/Account")).Account,
                }),
              },
            ],
          },
        ],
      },
    ],
  },
];

if (!userAppOnly) {
  routes.push({
    element: <RoleGate allowedRoles={["tenant_admin"]} />,
    children: [
      {
        element: <TenantAccessGate />,
        children: [
          {
            path: "/admin",
            lazy: async () => ({
              Component: (await import("./components/admin/AdminLayout")).AdminLayout,
            }),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import("./components/admin/AdminDashboard"))
                    .AdminDashboard,
                }),
              },
              {
                path: "loans",
                lazy: async () => ({
                  Component: (await import("./components/admin/AdminLoans")).AdminLoans,
                }),
              },
              {
                path: "users",
                lazy: async () => ({
                  Component: (await import("./components/admin/AdminUsers")).AdminUsers,
                }),
              },
              {
                path: "reports",
                lazy: async () => ({
                  Component: (await import("./components/admin/AdminReports")).AdminReports,
                }),
              },
            ],
          },
        ],
      },
    ],
  });

  routes.push({
    element: <RoleGate allowedRoles={["super_admin"]} />,
    children: [
      {
        path: "/super-admin",
        lazy: async () => ({
          Component: (await import("./components/super-admin/SuperAdminLayout"))
            .SuperAdminLayout,
        }),
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("./components/super-admin/SuperAdminDashboard"))
                .SuperAdminDashboard,
            }),
          },
          {
            path: "tenants",
            lazy: async () => ({
              Component: (await import("./components/super-admin/SuperAdminTenants"))
                .SuperAdminTenants,
            }),
          },
          {
            path: "premium-requests",
            lazy: async () => ({
              Component: (
                await import("./components/super-admin/SuperAdminPremiumRequests")
              ).SuperAdminPremiumRequests,
            }),
          },
        ],
      },
    ],
  });
}

routes.push({
  path: "*",
  Component: NotFound,
});

export const router = createBrowserRouter(routes);
