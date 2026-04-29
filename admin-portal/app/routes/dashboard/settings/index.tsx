import { settings } from "~/data/admin-prototype";
import {
  Avatar,
  Button,
  Card,
  Field,
  PageHeader,
  StatusBadge,
} from "~/components/prototype-ui";

export default function SettingsPage() {
  return (
    <section>
      <PageHeader
        title="System Settings"
        description="Configure IET Tanzania portal system settings"
      />

      <div className="grid gap-[18px] xl:grid-cols-2">
        <Card title="Organisation Details">
          <div className="space-y-[14px]">
            {settings.organization.map((field) => (
              <Field key={field.label} label={field.label} value={field.value} />
            ))}
            <Button tone="dark">Save Changes</Button>
          </div>
        </Card>

        <Card title="Membership Fees (TZS)">
          <div className="space-y-[14px]">
            {settings.fees.map((field) => (
              <Field key={field.label} label={field.label} value={field.value} />
            ))}
            <Button tone="dark">Update Fees</Button>
          </div>
        </Card>

        <Card title="Admin Users">
          <div className="space-y-[10px]">
            {settings.admins.map((admin, index) => (
              <div
                key={admin.email}
                className={`flex items-center gap-[10px] py-[9px] ${index < settings.admins.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <Avatar initials={admin.initials} tone={admin.tone} />
                <div className="flex-1">
                  <div className="text-[12px] font-semibold">{admin.name}</div>
                  <div className="text-[10px] text-[var(--muted)]">{admin.email}</div>
                </div>
                <StatusBadge tone={admin.badge}>{admin.badge === "super" ? "Super Admin" : admin.badge === "admin" ? "Admin" : "Finance"}</StatusBadge>
              </div>
            ))}
            <div className="pt-[14px]">
              <Button tone="dark">+ Add Admin User</Button>
            </div>
          </div>
        </Card>

        <Card title="Selcom Payment Config">
          <div className="space-y-[14px]">
            {settings.paymentConfig.map((field, index) => (
              <Field key={field.label} label={field.label} value={field.value} type={index < 2 ? "password" : "text"} />
            ))}
            <div className="mb-[14px] flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span className="text-[11.5px] font-semibold text-[var(--success)]">Selcom integration active</span>
            </div>
            <Button tone="dark">Update Config</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
