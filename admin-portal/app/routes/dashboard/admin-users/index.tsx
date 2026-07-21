import type { AxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, MoreVertical, PencilLine, Trash2 } from "lucide-react";
import { Button, Modal, PageHeader, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import { getStoredUser } from "~/utils/auth";
import type { AdminRole, ApiEnvelope } from "~/types";

type DisciplineTag = { id: string; name: string };

type Discipline = {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
};

type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  role: AdminRole;
  isActive: boolean;
  profilePhotoUrl?: string | null;
  disciplines?: DisciplineTag[];
  updatedAt?: string | null;
};

type AdminUserForm = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: AdminRole;
  isActive: boolean;
  password: string;
  disciplineIds: string[];
};

const ROLE_OPTIONS: AdminRole[] = [
  "ADMIN",
  "SECRETARIAT",
  "EVALUATOR",
  "MPDC",
  "COUNCIL",
  "SUPER_ADMIN",
];

const PANEL_ROLES: AdminRole[] = ["EVALUATOR", "MPDC", "COUNCIL"];

// Roles a plain ADMIN may assign/manage. Only a SUPER_ADMIN can manage the
// ADMIN and SUPER_ADMIN roles (mirrors the backend guard).
const ELEVATED_ROLES: AdminRole[] = ["ADMIN", "SUPER_ADMIN"];

function isPanelRole(role: AdminRole): boolean {
  return PANEL_ROLES.includes(role);
}

function isElevatedRole(role: AdminRole): boolean {
  return ELEVATED_ROLES.includes(role);
}

const EMPTY_FORM: AdminUserForm = {
  email: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  role: "SECRETARIAT",
  isActive: true,
  password: "",
  disciplineIds: [],
};

function roleLabel(role?: string | null) {
  return (role ?? "ADMIN")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(user: AdminUser) {
  const source = user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "A";
}

function displayName(user: AdminUser) {
  return user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function RoleBadge({ role }: { role: AdminRole }) {
  const tone = role === "SUPER_ADMIN" ? "super" : role === "ADMIN" ? "admin" : "blue";
  return <StatusBadge tone={tone}>{roleLabel(role)}</StatusBadge>;
}

function UserAvatar({ user }: { user: AdminUser }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = user.profilePhotoUrl && !failed;

  return (
    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--red)] text-[11px] font-bold text-white">
      {showPhoto ? (
        <img
          src={user.profilePhotoUrl ?? ""}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : initials(user)}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [showValue, setShowValue] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
        {label}{required ? " *" : ""}
      </span>
      <div className="relative">
        <input
          type={isPassword && showValue ? "text" : type}
          value={value}
          disabled={disabled}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className={`h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowValue((value) => !value)}
            className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--text)]"
            aria-label={showValue ? "Hide password" : "Show password"}
            aria-pressed={showValue}
          >
            {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        ) : null}
      </div>
    </label>
  );
}

export default function AdminUsersPage() {
  const currentUser = getStoredUser();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const canManage = isSuperAdmin || currentUser?.role === "ADMIN";
  // Roles the current actor may assign in the create/edit form.
  const assignableRoles = isSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((role) => !isElevatedRole(role));
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionMenuTriggerRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<AdminUserForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  async function loadUsers() {
    if (!canManage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    try {
      const { data } = await http.get<ApiEnvelope<AdminUser[]>>(`/admin/users?${params}`);
      setUsers(data.data ?? []);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setPageError(apiError.response?.data?.message ?? "Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadUsers(), search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, canManage]);

  useEffect(() => {
    if (!canManage) return;
    void (async () => {
      try {
        const { data } = await http.get<ApiEnvelope<Discipline[]>>("/admin/disciplines?activeOnly=true");
        setDisciplines(data.data ?? []);
      } catch {
        // Disciplines are optional; ignore load failures here.
      }
    })();
  }, [canManage]);

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionMenuRef.current?.contains(target)) return;
      if (actionMenuTriggerRef.current?.contains(target)) return;
      if (actionMenuUserId) {
        setActionMenuUserId(null);
        setActionMenuPosition(null);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionMenuUserId(null);
        setActionMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const visibleUsers = useMemo(() => users, [users]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
      role: user.role,
      isActive: user.isActive,
      password: "",
      disciplineIds: (user.disciplines ?? []).map((d) => d.id),
    });
    setFormError(null);
    setModalOpen(true);
  }

  // A plain admin may not manage Admin/Super Admin accounts; a super admin may
  // manage everyone except other super admins.
  function canManageTarget(user: AdminUser) {
    if (!canManage || user.id === currentUser?.id) return false;
    return isSuperAdmin ? user.role !== "SUPER_ADMIN" : !isElevatedRole(user.role);
  }

  function canEditRow(user: AdminUser) {
    return canManageTarget(user);
  }

  function canDeleteRow(user: AdminUser) {
    return canManageTarget(user);
  }

  function openView(user: AdminUser) {
    setViewingUser(user);
    setActionMenuUserId(null);
    setActionMenuPosition(null);
  }

  function openMenu(user: AdminUser, trigger: HTMLButtonElement) {
    const current = actionMenuUserId === user.id;
    if (current) {
      setActionMenuUserId(null);
      setActionMenuPosition(null);
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 170;
    const estimatedHeight = 116;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;
    const top = openUp ? Math.max(8, rect.top - estimatedHeight - gap) : rect.bottom + gap;
    const left = Math.max(8, Math.min(window.innerWidth - menuWidth - 8, rect.right - menuWidth));

    setActionMenuUserId(user.id);
    setActionMenuPosition({ top, left });
  }

  async function confirmDelete() {
    if (!deletingUser) return;
    setSaving(true);
    setFormError(null);

    try {
      await http.delete(`/admin/users/${deletingUser.id}`);
      setDeletingUser(null);
      await loadUsers();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFormError(apiError.response?.data?.message ?? "Failed to delete admin user.");
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const disciplineIds = isPanelRole(form.role) ? form.disciplineIds : [];
      if (editing) {
        await http.patch(`/admin/users/${editing.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phoneNumber || undefined,
          role: form.role,
          isActive: form.isActive,
          disciplineIds,
        });
      } else {
        await http.post("/admin/users", {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNumber: form.phoneNumber || undefined,
          role: form.role,
          isActive: form.isActive,
          password: form.password || undefined,
          disciplineIds,
        });
      }
      setModalOpen(false);
      await loadUsers();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFormError(apiError.response?.data?.message ?? "Failed to save admin user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <PageHeader
        title="Users"
        description="Manage portal users and membership application workflow roles"
        actions={canManage ? <Button tone="dark" onClick={openCreate}>Add User</Button> : undefined}
      />

      {!canManage ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-white px-5 py-8 text-center text-[12px] text-[var(--muted)]">
          You do not have permission to manage portal users.
        </div>
      ) : (
        <>
          <div className="mb-[14px] flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="h-[34px] min-w-[220px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-white px-3 text-[12px] outline-none focus:border-[var(--red-dark)]"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-white px-3 text-[12px] outline-none focus:border-[var(--red-dark)]"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </select>
          </div>

          {pageError && (
            <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
              {pageError}
            </div>
          )}

          <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
            <div className="overflow-x-auto">
              <table className="table-proto min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Phone</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading admin users...</td></tr>
                  ) : visibleUsers.length ? visibleUsers.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <UserAvatar user={user} />
                            <div>
                              <div className="text-[12px] font-semibold">{displayName(user)}</div>
                              <div className="text-[10px] text-[var(--muted)]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><RoleBadge role={user.role} /></td>
                        <td>
                          <StatusBadge tone={user.isActive ? "active" : "rejected"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </StatusBadge>
                        </td>
                        <td className="text-[11.5px]">{user.phoneNumber ?? "-"}</td>
                        <td className="text-[11.5px]">
                          {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("en-TZ") : "-"}
                        </td>
                        <td>
                          <div className="inline-flex" ref={actionMenuUserId === user.id ? actionMenuTriggerRef : undefined}>
                            <button
                              type="button"
                              onClick={(event) => openMenu(user, event.currentTarget)}
                              className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[7px] border border-[var(--border)] bg-white text-[var(--muted)] transition-colors duration-150 hover:border-[var(--red-light)] hover:bg-[var(--red-pale)] hover:text-[var(--red-dark)]"
                              aria-label={`Open actions for ${displayName(user)}`}
                              aria-haspopup="menu"
                              aria-expanded={actionMenuUserId === user.id}
                            >
                              <MoreVertical size={15} />
                            </button>

                            {actionMenuUserId === user.id && (
                              <div
                                ref={actionMenuRef}
                                role="menu"
                                aria-label="User actions"
                                style={{ top: actionMenuPosition?.top ?? 0, left: actionMenuPosition?.left ?? 0 }}
                                className="fixed z-30 w-[170px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.16)]"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => openView(user)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11.5px] font-semibold text-[var(--text)] hover:bg-[var(--red-pale)]"
                                >
                                  <Eye size={14} className="text-[var(--muted)]" />
                                  View
                                </button>
                                {canEditRow(user) && (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                      setActionMenuUserId(null);
                                      setActionMenuPosition(null);
                                      openEdit(user);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11.5px] font-semibold text-[var(--text)] hover:bg-[var(--red-pale)]"
                                  >
                                    <PencilLine size={14} className="text-[var(--muted)]" />
                                    Edit
                                  </button>
                                )}
                                {canDeleteRow(user) && (
                                  <>
                                    <div className="h-px bg-[var(--border)]" />
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        setActionMenuUserId(null);
                                        setActionMenuPosition(null);
                                        setDeletingUser(user);
                                        setFormError(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11.5px] font-semibold text-[var(--red)] hover:bg-[var(--red-pale)]"
                                    >
                                      <Trash2 size={14} />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">No admin users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Modal
        title={editing ? "Edit User" : "Add User"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button tone="dark" onClick={(event) => void saveUser(event)} disabled={saving}>
              {saving ? "Saving..." : "Save User"}
            </Button>
          </div>
        }
      >
        <form onSubmit={(event) => void saveUser(event)} className="space-y-[14px]">
          {formError && (
            <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
              {formError}
            </div>
          )}
          <TextField label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} type="email" disabled={Boolean(editing)} required />
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="First Name" value={form.firstName} onChange={(value) => setForm((prev) => ({ ...prev, firstName: value }))} required />
            <TextField label="Last Name" value={form.lastName} onChange={(value) => setForm((prev) => ({ ...prev, lastName: value }))} required />
          </div>
          <TextField label="Phone Number" value={form.phoneNumber} onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))} />
          {!editing && (
            <div>
              <TextField label="Initial Password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} type="password" />
              <p className="mt-1 text-[10.5px] text-[var(--muted)]">
                Leave blank to auto-generate a temporary password and email login credentials to the user.
              </p>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Role</span>
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>{roleLabel(role)}</option>
                  ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                Account Status
              </span>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.value === "active" }))
                }
                className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          {isPanelRole(form.role) && (
            <div className="block">
              <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                Disciplines
              </span>
              <p className="mb-2 text-[10.5px] text-[var(--muted)]">
                Applications are routed to evaluators whose disciplines match the applicant&rsquo;s field.
              </p>
              {disciplines.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)]">No disciplines defined yet.</p>
              ) : (
                <div className="max-h-[180px] overflow-y-auto rounded-[8px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] p-2">
                  {disciplines
                    .filter((d) => !d.parentId)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .flatMap((parent) => [
                      parent,
                      ...disciplines
                        .filter((c) => c.parentId === parent.id)
                        .sort((a, b) => a.name.localeCompare(b.name)),
                    ])
                    .map((d) => {
                      const checked = form.disciplineIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className="flex cursor-pointer items-center gap-2 py-[3px] text-[12px] text-[var(--text)]"
                          style={{ paddingLeft: d.parentId ? 18 : 0 }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                disciplineIds: event.target.checked
                                  ? [...prev.disciplineIds, d.id]
                                  : prev.disciplineIds.filter((id) => id !== d.id),
                              }))
                            }
                          />
                          {d.parentId && <span className="text-[var(--muted)]">↳</span>}
                          {d.name}
                        </label>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        title="User Details"
        open={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        footer={
          <div className="flex justify-end gap-2">
            {viewingUser && canEditRow(viewingUser) ? (
              <Button
                tone="dark"
                onClick={() => {
                  const user = viewingUser;
                  setViewingUser(null);
                  openEdit(user);
                }}
              >
                Edit User
              </Button>
            ) : null}
            <Button tone="outline" onClick={() => setViewingUser(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewingUser ? (
          <div className="space-y-[14px]">
            <div className="flex items-center gap-3">
              <UserAvatar user={viewingUser} />
              <div>
                <div className="text-[13px] font-semibold text-[var(--red-dark)]">
                  {displayName(viewingUser)}
                </div>
                <div className="text-[11px] text-[var(--muted)]">{viewingUser.email}</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField label="Role" value={roleLabel(viewingUser.role)} onChange={() => {}} disabled />
              <TextField label="Status" value={viewingUser.isActive ? "Active" : "Inactive"} onChange={() => {}} disabled />
              <TextField label="Phone" value={viewingUser.phoneNumber ?? ""} onChange={() => {}} disabled />
              <TextField label="Updated" value={viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString("en-TZ") : "-"} onChange={() => {}} disabled />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Delete User"
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="outline" onClick={() => setDeletingUser(null)} disabled={saving}>
              Cancel
            </Button>
            <Button tone="red" onClick={() => void confirmDelete()} disabled={saving}>
              {saving ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        }
      >
        {deletingUser ? (
          <div className="space-y-4">
            <p className="text-[12px] text-[var(--text)]">
              Delete <strong>{displayName(deletingUser)}</strong> ({deletingUser.email})?
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              This will remove the portal account, but it will not affect membership records.
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
