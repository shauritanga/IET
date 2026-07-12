import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import { getStoredUser, USER_KEY } from "~/utils/auth";
import { setCookie } from "~/utils/cookies";
import type { ApiEnvelope, LoginUser } from "~/types";

type AdminProfile = LoginUser & {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  employer?: string | null;
  position?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function roleLabel(role?: string | null) {
  return (role ?? "ADMIN")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initials(profile?: AdminProfile | null) {
  const source = profile?.fullName || `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || profile?.email || "Admin";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "A";
}

function updateStoredUser(profile: AdminProfile) {
  if (typeof window === "undefined") return;
  const stored = getStoredUser();
  const next = {
    ...stored,
    ...profile,
    fullName: profile.fullName || `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() || profile.email,
  };
  window.localStorage.setItem(USER_KEY, JSON.stringify(next));
  setCookie(USER_KEY, JSON.stringify(next));
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  const [showValue, setShowValue] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">{label}</span>
      <div className="relative">
        <input
          type={isPassword && showValue ? "text" : type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className={`h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white read-only:cursor-not-allowed read-only:opacity-70 ${isPassword ? "pr-10" : ""}`}
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

export default function AdminProfilePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    location: "",
    employer: "",
    position: "",
  });

  async function loadProfile() {
    setLoading(true);
    setProfileError(null);
    try {
      const { data } = await http.get<ApiEnvelope<AdminProfile>>("/users/profile");
      setProfile(data.data);
      setForm({
        firstName: data.data.firstName ?? "",
        lastName: data.data.lastName ?? "",
        phoneNumber: data.data.phoneNumber ?? "",
        location: data.data.location ?? "",
        employer: data.data.employer ?? "",
        position: data.data.position ?? "",
      });
      updateStoredUser(data.data);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setProfileError(apiError.response?.data?.message ?? "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const { data } = await http.put<ApiEnvelope<AdminProfile>>("/users/profile", form);
      setProfile(data.data);
      updateStoredUser(data.data);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setProfileError(apiError.response?.data?.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    setUploading(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const { data } = await http.post<ApiEnvelope<{ profilePhotoUrl: string }>>("/users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nextProfile = profile ? { ...profile, profilePhotoUrl: data.data.profilePhotoUrl } : null;
      if (nextProfile) {
        setProfile(nextProfile);
        updateStoredUser(nextProfile);
      }
      setProfileMessage("Profile photo updated successfully.");
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setProfileError(apiError.response?.data?.message ?? "Failed to upload photo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordMessage(null);

    try {
      await http.post("/auth/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setPasswordError(apiError.response?.data?.message ?? "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const fullName = profile?.fullName || `${form.firstName} ${form.lastName}`.trim() || profile?.email || "Admin";

  return (
    <section>
      <PageHeader
        title="My Profile"
        description="Manage your admin account details, photo, and password"
      />

      {profileError && (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          {profileError}
        </div>
      )}
      {profileMessage && (
        <div className="mb-[14px] rounded-[10px] border border-[#b7e4c7] bg-[#e8f5e9] px-4 py-3 text-[11.5px] font-semibold text-[#1a6b3c]">
          {profileMessage}
        </div>
      )}

      <div className="grid gap-[18px] xl:grid-cols-[1fr_360px]">
        <Card>
          {loading ? (
            <div className="py-8 text-center text-[12px] text-[var(--muted)]">Loading profile...</div>
          ) : (
            <div className="space-y-[16px]">
              <div className="flex items-center gap-4">
                <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--red-light)] bg-[var(--red)] text-[22px] font-bold text-white">
                  {profile?.profilePhotoUrl ? (
                    <img src={profile.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : initials(profile)}
                </div>
                <div>
                  <div className="text-[16px] font-extrabold text-[var(--red-dark)]">{fullName}</div>
                  <div className="mt-1 text-[11px] text-[var(--muted)]">{profile?.email}</div>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge tone={profile?.role === "SUPER_ADMIN" ? "super" : "admin"}>
                      {roleLabel(profile?.role)}
                    </StatusBadge>
                    <StatusBadge tone={profile?.isActive === false ? "rejected" : "active"}>
                      {profile?.isActive === false ? "Inactive" : "Active"}
                    </StatusBadge>
                  </div>
                </div>
                <div className="ml-auto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void uploadPhoto(event)}
                    className="hidden"
                  />
                  <Button tone="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "Change Photo"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="First Name" value={form.firstName} onChange={(value) => setForm((prev) => ({ ...prev, firstName: value }))} />
                <TextField label="Last Name" value={form.lastName} onChange={(value) => setForm((prev) => ({ ...prev, lastName: value }))} />
                <TextField label="Email" value={profile?.email ?? ""} readOnly />
                <TextField label="Phone Number" value={form.phoneNumber} onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))} />
                <TextField label="Location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} />
                <TextField label="Employer" value={form.employer} onChange={(value) => setForm((prev) => ({ ...prev, employer: value }))} />
                <TextField label="Position" value={form.position} onChange={(value) => setForm((prev) => ({ ...prev, position: value }))} />
              </div>

              <Button tone="dark" onClick={() => void saveProfile()} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          )}
        </Card>

        <Card title="Change Password">
          <form className="space-y-[14px]" onSubmit={(event) => void changePassword(event)}>
            {passwordError && (
              <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
                {passwordError}
              </div>
            )}
            {passwordMessage && (
              <div className="rounded-[8px] border border-[#b7e4c7] bg-[#e8f5e9] px-3 py-2 text-[11.5px] font-semibold text-[#1a6b3c]">
                {passwordMessage}
              </div>
            )}
            <TextField label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))} />
            <TextField label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))} />
            <TextField label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))} />
            <p className="text-[10.5px] leading-4 text-[var(--muted)]">
              Use at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
            <Button tone="dark" type="submit" disabled={passwordSaving}>
              {passwordSaving ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}
