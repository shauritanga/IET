import { NavLink } from "react-router";
import { Building2, CalendarRange, CreditCard, LayoutDashboard, PanelLeft, Tags, Users } from "lucide-react";
import { getStoredUser } from "~/utils/auth";

type SidebarIconName = "dashboard" | "payments" | "members" | "training" | "categories" | "institutions";

const navItems: Array<{ label: string; icon: SidebarIconName; to: string; end?: boolean }> = [
  { label: "Dashboard", icon: "dashboard", to: "/dashboard", end: true },
  { label: "Payments", icon: "payments", to: "/dashboard/applications" },
  { label: "Members", icon: "members", to: "/dashboard/members" },
  { label: "Categories", icon: "categories", to: "/dashboard/membership-categories" },
  { label: "Institutions", icon: "institutions", to: "/dashboard/engineering-institutions" },
  { label: "Event & Training", icon: "training", to: "/dashboard/events" },
];

function toRoleLabel(role?: string | null) {
  if (!role) return "Admin";
  return role
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "A";
}

function sidebarIcon(name: SidebarIconName) {
  if (name === "dashboard") {
    return <LayoutDashboard aria-hidden="true" />;
  }

  if (name === "payments") {
    return <CreditCard aria-hidden="true" />;
  }

  if (name === "members") {
    return <Users aria-hidden="true" />;
  }

  if (name === "training") {
    return <CalendarRange aria-hidden="true" />;
  }

  if (name === "categories") {
    return <Tags aria-hidden="true" />;
  }

  if (name === "institutions") {
    return <Building2 aria-hidden="true" />;
  }

  return null;
}

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const user = getStoredUser();
  const userName = user?.fullName ?? "Joram Jackson";

  return (
    <aside className={`sidebar${isCollapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <img src="/IET-logo.png" alt="" className="sidebar-brand-logo" />
          <div className="sidebar-brand-copy" aria-label="Institution of Engineers Tanzania">
            <span>Institution</span>
            <span>of Engineers</span>
            <span>Tanzania (IET)</span>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-collapse-btn"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={isCollapsed}
          onClick={onToggle}
        >
          <PanelLeft aria-hidden="true" className="sidebar-collapse-icon" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-nav-item${isActive ? " active" : ""}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{sidebarIcon(item.icon)}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar" aria-hidden="true">{initials(userName)}</div>
        <div className="sidebar-user-copy">
          <p className="sidebar-user-name">{userName}</p>
          <p className="sidebar-user-role">{toRoleLabel(user?.role)}</p>
        </div>
      </div>
    </aside>
  );
}
