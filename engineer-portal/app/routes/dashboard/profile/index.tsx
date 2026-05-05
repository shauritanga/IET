import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import toast from "react-hot-toast"
import http from "~/utils/http"
import { useGetUserProfile } from "~/routes/dashboard/profile/repositories/handle-get-user-profile"
import { useUpdateUserProfile } from "~/routes/dashboard/profile/repositories/handle-update-user-profile"

function getInitials(firstName?: string, lastName?: string): string {
    const f = firstName?.[0]?.toUpperCase() ?? ""
    const l = lastName?.[0]?.toUpperCase() ?? ""
    return f + l || "IE"
}

function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })
}

function formatLabel(value?: string | null): string {
    if (!value) return "—"
    return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function getApplicationAction(status?: string | null) {
    if (status === "DRAFT" || status === "CHANGES_REQUESTED") {
        return { label: "Continue Application", to: "/application/personal-details" }
    }
    if (status === "REJECTED") {
        return { label: "Start New Application", to: "/application/personal-details" }
    }
    return null
}

function getStatusBadgeClass(status?: string | null) {
    if (status === "REJECTED") return "badge b-red"
    if (status === "APPROVED") return "badge b-green"
    return "badge b-yellow"
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
    const latestApplication = profile?.latestApplication
    const currentExperience = latestApplication?.experiences?.find((experience) => experience.isCurrent)
    const displayDiscipline = profile?.engineeringDiscipline || latestApplication?.engineeringDiscipline || ""
    const displayLocation = profile?.location || currentExperience?.location || latestApplication?.educations?.find((education) => education.location)?.location || ""
    const displayEmployer = profile?.employer || currentExperience?.employerName || ""
    const membershipLabel = profile?.membershipClass ?? latestApplication?.appliedMembershipClass ?? "Member"
    const applicationAction = getApplicationAction(latestApplication?.status)

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
                        {displayDiscipline && (
                            <span className="p-chip red">{displayDiscipline}</span>
                        )}
                        {membershipLabel && (
                            <span className="p-chip red">{membershipLabel}</span>
                        )}
                        {profile?.membershipId && (
                            <span className="p-chip">{profile.membershipId}</span>
                        )}
                        {displayLocation && (
                            <span className="p-chip">{displayLocation}</span>
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
                                placeholder={displayLocation || undefined}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current Employer</label>
                            <input
                                className="form-input"
                                value={employer}
                                placeholder={displayEmployer || undefined}
                                onChange={(e) => setEmployer(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Engineering Discipline</label>
                            <input
                                className="form-input"
                                value={discipline}
                                placeholder={displayDiscipline || undefined}
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
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{membershipLabel || "—"}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Member No.</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{profile?.membershipId ?? "—"}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Discipline</td>
                                        <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{displayDiscipline || "—"}</td>
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
                        <div className="card-head"><span className="card-title">Application Profile</span></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {latestApplication ? (
                                <table>
                                    <tbody>
                                        <tr>
                                            <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Reference</td>
                                            <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{latestApplication.referenceNumber ?? "Pending"}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Application Status</td>
                                            <td style={{ padding: "10px 15px" }}>
                                                <span className={getStatusBadgeClass(latestApplication.status)}>{formatLabel(latestApplication.status)}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Review Stage</td>
                                            <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatLabel(latestApplication.reviewStage)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Submitted</td>
                                            <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{formatDate(latestApplication.submittedAt)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ color: "var(--iet-muted)", fontSize: 11.5, padding: "10px 15px" }}>Payment</td>
                                            <td style={{ fontSize: 12, fontWeight: 600, padding: "10px 15px" }}>{latestApplication.paymentCompleted ? "Completed" : "Pending"}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ color: "var(--iet-muted)", fontSize: 12 }}>No membership application has been started yet.</div>
                            )}
                            {latestApplication?.reviewComments && (
                                <div style={{ margin: 15, padding: 12, border: "1px solid var(--iet-border)", borderRadius: 8, color: "var(--iet-muted)", fontSize: 12 }}>
                                    {latestApplication.reviewComments}
                                </div>
                            )}
                            {latestApplication?.rejectionReason && (
                                <div style={{ margin: 15, padding: 12, border: "1px solid rgba(220,38,38,.3)", borderRadius: 8, color: "var(--iet-red-dark)", fontSize: 12 }}>
                                    {latestApplication.rejectionReason}
                                </div>
                            )}
                            {applicationAction && (
                                <div style={{ padding: "0 15px 15px" }}>
                                    <Link className="btn btn-outline btn-sm" to={applicationAction.to}>{applicationAction.label}</Link>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
                <div className="card-head"><span className="card-title">Documents</span></div>
                <div className="card-body">
                    {(latestApplication?.documents?.length ?? 0) > 0 ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                            {latestApplication?.documents.map((item) => (
                                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid var(--iet-border)", borderRadius: 8, padding: 12 }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700 }}>{formatLabel(item.documentType)}</div>
                                        <div style={{ color: "var(--iet-muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.fileName}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                        <span className={getStatusBadgeClass(item.status)}>{formatLabel(item.status)}</span>
                                        <a className="card-action" href={item.fileUrl} target="_blank" rel="noreferrer">View</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: "var(--iet-muted)", fontSize: 12 }}>No documents found.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
