import { createBrowserRouter } from "react-router";
import { Login } from "./components/user/Login";
import { UserLayout } from "./components/user/UserLayout";
import { Home } from "./components/user/Home";
import { Reminders } from "./components/user/Reminders";
import { Support } from "./components/user/Support";
import { Offers } from "./components/user/Offers";
import { LoanDetails } from "./components/user/LoanDetails";
import { Catalog } from "./components/user/Catalog";
import { CatalogDetails } from "./components/user/CatalogDetails";
import { Account } from "./components/user/Account";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminLoans } from "./components/admin/AdminLoans";
import { AdminUsers } from "./components/admin/AdminUsers";
import { NotFound } from "./components/NotFound";

const userAppOnly = import.meta.env.VITE_USER_APP_ONLY === "true";

const routes = [
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/user",
    Component: UserLayout,
    children: [
      { index: true, Component: Home },
      { path: "catalog", Component: Catalog },
      { path: "catalog/:id", Component: CatalogDetails },
      { path: "reminders", Component: Reminders },
      { path: "support", Component: Support },
      { path: "offers", Component: Offers },
      { path: "loan-details", Component: LoanDetails },
      { path: "account", Component: Account },
    ],
  },
];

if (!userAppOnly) {
  routes.push({
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: "loans", Component: AdminLoans },
      { path: "users", Component: AdminUsers },
    ],
  });
}

routes.push({
  path: "*",
  Component: NotFound,
});

export const router = createBrowserRouter(routes);
