import { useState } from "react";
import { Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import Sidebar from "~/components/sidebar";
import { getCookieValue } from "~/utils/cookies";
import { isAdminRole, ROLE_KEY, TOKEN_KEY } from "~/utils/auth";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const token = getCookieValue(request, TOKEN_KEY);
  const role = getCookieValue(request, ROLE_KEY);

  if (!token || !isAdminRole(role)) {
    return redirect("/auth/login");
  }

  return null;
};

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <section className={`dashboard-shell${isSidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((current) => !current)}
      />
      <main className="content">
        <Outlet />
      </main>
    </section>
  );
}
