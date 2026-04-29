import { LogOut } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import { clearSession, getStoredUser } from "~/utils/auth";
import { navGroups, pageLabels } from "~/data/admin-prototype";

function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function MembersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EventsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PaymentsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4.6H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.64.2 1.09.79 1.09 1.46V11a2 2 0 1 1 0 4h-.09c-.67 0-1.26.45-1.46 1.09Z" />
    </svg>
  );
}

function ToggleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function navIcon(label: string) {
  if (label === "Dashboard") return <DashboardIcon />;
  if (label === "Applications") return <ApplicationsIcon />;
  if (label === "Members") return <MembersIcon />;
  if (label === "Events") return <EventsIcon />;
  if (label === "Payments") return <PaymentsIcon />;
  if (label === "Reports") return <ReportsIcon />;
  return <SettingsIcon />;
}

export default function AdminShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const pageLabel = pageLabels[location.pathname] ?? "Dashboard";
  const userName = user?.fullName ?? "Admin";
  const userRole = user?.role ?? "ADMIN";
  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "A";
  const todayDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <aside
        className={`fixed inset-y-0 left-0 z-[200] flex w-[260px] flex-col border-r border-[var(--border)] bg-white shadow-[1px_0_12px_rgba(0,0,0,0.06)] transition-transform duration-[240ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
      >
        <div className="flex items-center gap-[11px] border-b border-[var(--border)] px-[18px] pb-[14px] pt-[18px]">
          <div className="h-10 w-10 rounded-[8px] bg-[var(--red-pale)] p-[3px]">
            <img src="/IET-logo.png" alt="" className="h-full w-full rounded-[6px] object-contain" />
          </div>
          <div className="min-w-0">
            <span className="block text-[11.5px] font-bold leading-[1.3] text-[var(--red-dark)]">
              Institution of Engineers Tanzania
            </span>
            <span className="mt-[2px] block text-[9px] font-semibold uppercase tracking-[0.09em] text-[var(--muted)]">
              Admin Portal
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-0 py-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-[18px] pb-1 pt-[10px] text-[8.5px] font-bold uppercase tracking-[1.8px] text-[var(--muted)] opacity-60">
                {group.label}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  className={({ isActive }) =>
                    `flex select-none items-center gap-[10px] border-l-[3px] px-[18px] py-[9px] text-[12px] font-medium transition-all duration-[160ms] ${
                      isActive
                        ? "border-[var(--red)] bg-[var(--red-light)] font-bold text-[var(--red)]"
                        : "border-transparent text-[var(--muted)] hover:bg-[var(--red-light)] hover:text-[var(--red)]"
                    }`
                  }
                >
                  <span className="shrink-0">{navIcon(item.label)}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-[9px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--red-light)] bg-[var(--red)] text-[11px] font-bold text-white">
              {initials}
            </div>
            <div>
              <strong className="block text-[11px] text-[var(--red-dark)]">{userName}</strong>
              <span className="text-[9.5px] text-[var(--muted)]">{userRole.replaceAll("_", " ")}</span>
            </div>
            <button
              type="button"
              className="ml-auto cursor-pointer text-[var(--muted)] transition-colors duration-150 hover:text-[var(--red)]"
              onClick={() => {
                clearSession();
                navigate("/auth/login", { replace: true });
              }}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className={`min-h-screen transition-[margin-left] duration-[240ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] ${collapsed ? "ml-0" : "ml-[260px]"}`}>
        <div className="sticky top-0 z-[100] flex h-[50px] items-center justify-between border-b border-[var(--border)] bg-white px-5 shadow-[0_1px_6px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-[11px]">
            <button
              type="button"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-[5px] border-[1.5px] border-transparent bg-transparent text-[var(--muted)] transition-all duration-150 hover:border-[var(--border)] hover:bg-[var(--red-pale)] hover:text-[var(--red)]"
              onClick={() => setCollapsed((value) => !value)}
              title="Toggle sidebar"
            >
              <ToggleIcon />
            </button>
            <div className="text-[11px] text-[var(--muted)]">
              IET Tanzania Admin › <span className="text-[11.5px] font-bold text-[var(--red)]">{pageLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-[11px]">
            <div className="rounded-full border border-[var(--border)] bg-[var(--red-pale)] px-[11px] py-1 text-[10.5px] text-[var(--muted)]">
              {todayDate}
            </div>
            <div className="relative flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full border-[1.5px] border-transparent bg-transparent text-[var(--muted)] transition-all duration-150 hover:border-[var(--border)] hover:text-[var(--red)]">
              <BellIcon />
              <span className="absolute right-[7px] top-[6px] h-[6px] w-[6px] rounded-full bg-[var(--red)]" />
            </div>
            <div className="flex cursor-pointer items-center gap-2 rounded-[40px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[3px] pl-[3px] transition-[border-color,box-shadow] duration-[180ms] hover:border-[var(--red)] hover:shadow-[0_2px_8px_rgba(226,12,10,0.1)]">
              <div className="flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[var(--red)] text-[9px] font-bold text-white">
                {initials}
              </div>
              <span className="text-[11px] font-semibold text-[var(--red-dark)]">{userName}</span>
              <span className="ml-1 rounded-full bg-[var(--red)] px-2 py-[2px] text-[9px] font-extrabold uppercase tracking-[0.4px] text-white">
                {userRole.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <main className="p-[18px]">
          <div key={location.pathname} className="animate-page-rise">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
