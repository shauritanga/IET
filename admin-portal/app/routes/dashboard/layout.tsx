import { redirect, type LoaderFunctionArgs } from "react-router";
import AdminShell from "~/components/admin-shell";
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
  return <AdminShell />;
}
