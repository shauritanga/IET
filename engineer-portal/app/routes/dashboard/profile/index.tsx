import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import http from "~/utils/http"
import { useGetUserProfile } from "~/routes/dashboard/profile/repositories/handle-get-user-profile"
import { useUpdateUserProfile } from "~/routes/dashboard/profile/repositories/handle-update-user-profile"

const profileDocumentItems = [
    { label: "Membership Certificate", action: "Download" },
    { label: "CPD Record 2024", action: "Download" },
    { label: "Good Standing Letter", action: "Request" },
    { label: "Tax Invoice 2025", action: "Download" },
]

function getInitials(firstName?: string, lastName?: string): string {
    const f = firstName?.[0]?.toUpperCase() ?? ""
    const l = lastName?.[0]?.toUpperCase() ?? ""
    return f + l || "IE"
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })
}

const Profile = () => {
    const { data, isPending } = useGetUserProfile()
    const { mutate: saveProfile, isPending: isSaving } = useUpdateUserProfile()
    const queryClient = useQueryClient()
    const photoInputRef = useRef<HTMLInputElement | null>(null)
    const profile = data?.data

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [location, setLocation] = useState("")
    const [employer, setEmployer] = useState("")
    const [discipline, setDiscipline] = useState("")
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

    useEffect(() => {
        if (!profile) return
        setFirstName(profile.firstName ?? "")
        setLastName(profile.lastName ?? "")
        setPhone(profile.phoneNumber ?? "")
        setLocation(profile.location ?? "")
        setEmployer(profile.employer ?? "")
        setDiscipline(profile.engineeringDiscipline ?? "")
        setPhotoPreview(profile.profilePhotoUrl ?? null)
    }, [profile])

    const handleSave = () => {
        saveProfile({ firstName, lastName, phoneNumber: phone, location, employer, engineeringDiscipline: discipline })
    }

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("photo", file)
        setIsUploadingPhoto(true)

        try {
            const response = await http.post<{ data: { profilePhotoUrl: string } }>("/users/profile/photo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            setPhotoPreview(response.data.data.profilePhotoUrl)
            await queryClient.invalidateQueries({ queryKey: ["user-profile"] })
            toast.success("Profile photo updated")
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Failed to upload photo")
        } finally {
            setIsUploadingPhoto(false)
            event.target.value = ""
        }
    }

    const initials = getInitials(profile?.firstName, profile?.lastName)
    const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : ""
    const membershipLabel = profile?.membershipClass ?? "Member"

    const statusBadgeClass = profile?.isMembershipExpired ? "badge b-red" : "badge b-green"
    const statusLabel = profile?.membershipStatus ?? "—"

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>My Profile</h3>
                    <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>Manage your personal and professional information</p>
                </div>
                <button className="btn btn-red" onClick={handleSave} disabled={isSaving || isPending}>
                    {isSaving ? "Saving…" : "Save Changes"}
                </button>
            </div>

            <div className="profile-hero">
                <div className="p-ava" style={{ overflow: "hidden" }}>
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt={fullName ? `${fullName} profile photo` : "Profile photo"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : initials}
                </div>
                <div>
                    {isPending ? (
                        <div style={{ height: 21, width: 180, background: "var(--iet-border)", borderRadius: 6, marginBottom: 6 }} />
                    ) : (
                        <div className="p-name">{fullName || "—"}</div>
                    )}
                    <div className="p-role">{membershipLabel} · Institution of Engineers Tanzania</div>
                    <div className="p-chips">
                        {profile?.engineeringDiscipline && (
                            <span className="p-chip red">{profile.engineeringDiscipline}</span>
                        )}
                        {profile?.membershipClass && (
                            <span className="p-chip red">{profile.membershipClass}</span>
                        )}
                        {profile?.membershipId && (
                            <span className="p-chip">{profile.membershipId}</span>
                        )}
                        {profile?.location && (
                            <span className="p-chip">{profile.location}</span>
                        )}
                    </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => void handlePhotoChange(event)}
                        style={{ display: "none" }}
                    />
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={isUploadingPhoto || isPending}
                        onClick={() => photoInputRef.current?.click()}
                    >
                        {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                    </button>
                </div>
            </div>

            <div className="prof-grid">
                <div className="card">
                    <div className="card-head"><span className="card-title">Personal Information</span></div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input
                                    className="form-input"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input
                                    className="form-input"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                className="form-input"
                                type="email"
                                value={profile?.email ?? ""}
                                readOnly
                                style={{ opacity: 0.7, cursor: "not-allowed" }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                className="form-input"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                className="form-input"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current Employer</label>
                            <input
                                className="form-input"
                                value={employer}
                                onChange={(e) => setEmployer(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Engineering Discipline</label>
                            <input
                                className="form-input"
                                value={discipline}
                                onChange={(e) => setDiscipline(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="card">
                        <div className="card-head"><span className="card-title">Membership Status</span></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table>
                                <tbody>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Grade</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.membershipClass ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Member No.</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.membershipId ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Discipline</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.engineeringDiscipline ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Status</td>
                                        <td style={{ padding: "10px 15px" }}>
                                            <span className={statusBadgeClass}>{statusLabel}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Expires</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatDate(profile?.membershipExpiryDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Joined</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatDate(profile?.joiningDate)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-head"><span className="card-title">Documents</span></div>
                        <div className="card-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {profileDocumentItems.map((item) => (
                                    <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 12 }}>📄 {item.label}</span>
                                        <span className="card-action">{item.action}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
