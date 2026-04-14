import { Bell, Building2, LockKeyhole, Save, ShieldCheck, UserCircle2 } from "lucide-react";

const preferenceItems = [
  {
    title: "Email Notifications",
    description: "Receive membership approvals, payment updates, and system summaries by email.",
    enabled: true,
  },
  {
    title: "Two-Factor Authentication",
    description: "Require an additional verification step for admin sign in.",
    enabled: true,
  },
  {
    title: "Event Reminders",
    description: "Send automatic reminders to admins for upcoming training sessions and events.",
    enabled: false,
  },
] as const;

const accessMembers = [
  { name: "Joram Jackson", role: "Super Admin", tone: "primary" },
  { name: "Neema Joseph", role: "Finance Manager", tone: "muted" },
  { name: "David Mushi", role: "Member Officer", tone: "muted" },
] as const;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function SettingsPage() {
  return (
    <section className="admin-settings-page">
      <div className="admin-members-header">
        <h1 className="admin-dashboard-title">Settings</h1>
        <button type="button" className="admin-members-add-btn">
          <Save size={14} aria-hidden="true" />
          <span>Save Changes</span>
        </button>
      </div>

      <section className="admin-settings-grid">
        <aside className="admin-settings-nav-card">
          <div className="admin-settings-nav-section">
            <p className="admin-settings-kicker">Workspace</p>
            <button type="button" className="admin-settings-nav-item is-active">
              <UserCircle2 size={16} aria-hidden="true" />
              <span>Profile Settings</span>
            </button>
            <button type="button" className="admin-settings-nav-item">
              <Building2 size={16} aria-hidden="true" />
              <span>Organization</span>
            </button>
            <button type="button" className="admin-settings-nav-item">
              <Bell size={16} aria-hidden="true" />
              <span>Notifications</span>
            </button>
            <button type="button" className="admin-settings-nav-item">
              <LockKeyhole size={16} aria-hidden="true" />
              <span>Security</span>
            </button>
            <button type="button" className="admin-settings-nav-item">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Access Roles</span>
            </button>
          </div>
        </aside>

        <div className="admin-settings-content">
          <article className="admin-settings-card">
            <div className="admin-settings-card-header">
              <div>
                <p className="admin-settings-kicker">Admin Profile</p>
                <h2>Profile Settings</h2>
              </div>
              <div className="admin-settings-profile-badge">
                <div className="admin-settings-profile-avatar" aria-hidden="true">JJ</div>
                <div>
                  <strong>Joram Jackson</strong>
                  <span>Admin portal owner</span>
                </div>
              </div>
            </div>

            <div className="admin-settings-form-grid">
              <label className="admin-settings-field">
                <span>Full Name</span>
                <input type="text" defaultValue="Joram Jackson" />
              </label>
              <label className="admin-settings-field">
                <span>Email Address</span>
                <input type="email" defaultValue="joram.jackson@iet.co.tz" />
              </label>
              <label className="admin-settings-field">
                <span>Phone Number</span>
                <input type="text" defaultValue="+255 754 000 221" />
              </label>
              <label className="admin-settings-field">
                <span>Role</span>
                <input type="text" defaultValue="Super Admin" />
              </label>
            </div>
          </article>

          <div className="admin-settings-two-column">
            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div>
                  <p className="admin-settings-kicker">Preferences</p>
                  <h2>Notifications & Security</h2>
                </div>
              </div>

              <div className="admin-settings-toggle-list">
                {preferenceItems.map((item) => (
                  <div className="admin-settings-toggle-item" key={item.title}>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <button
                      type="button"
                      className={`admin-settings-switch${item.enabled ? " is-on" : ""}`}
                      aria-pressed={item.enabled}
                    >
                      <span />
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-settings-card">
              <div className="admin-settings-card-header">
                <div>
                  <p className="admin-settings-kicker">Administration</p>
                  <h2>Access Roles</h2>
                </div>
              </div>

              <div className="admin-settings-access-list">
                {accessMembers.map((member) => (
                  <div className="admin-settings-access-item" key={member.name}>
                    <div className={`admin-settings-access-avatar${member.tone === "primary" ? " is-primary" : ""}`} aria-hidden="true">
                      {initials(member.name)}
                    </div>
                    <div>
                      <h3>{member.name}</h3>
                      <p>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="admin-settings-card">
            <div className="admin-settings-card-header">
              <div>
                <p className="admin-settings-kicker">Organization</p>
                <h2>Portal Preferences</h2>
              </div>
            </div>

            <div className="admin-settings-form-grid">
              <label className="admin-settings-field">
                <span>Institution Name</span>
                <input type="text" defaultValue="Institution of Engineers Tanzania" />
              </label>
              <label className="admin-settings-field">
                <span>Support Email</span>
                <input type="email" defaultValue="support@iet.co.tz" />
              </label>
              <label className="admin-settings-field admin-settings-field-wide">
                <span>Office Address</span>
                <input type="text" defaultValue="Dar es Salaam, Tanzania" />
              </label>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}
