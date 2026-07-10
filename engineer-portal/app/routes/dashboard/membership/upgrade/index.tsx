import { useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronRight, Loader2, TrendingUp } from "lucide-react";
import {
    useUpgradeEligibility,
    useSubmitUpgradeApplication,
    useMyUpgradeApplications,
    type EligibleCategory,
} from "~/routes/dashboard/membership/repositories/useUpgrade";
import { isAxiosError } from "axios";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number) {
    return `TZS ${n.toLocaleString()}`;
}

function statusColor(status: string) {
    switch (status) {
        case "APPROVED": return "var(--iet-green, #1a6b3c)";
        case "REJECTED": return "var(--iet-red, #c0392b)";
        case "CANCELLED": return "#888";
        default: return "var(--iet-amber, #b7791f)";
    }
}

function statusBg(status: string) {
    switch (status) {
        case "APPROVED": return "#e6f4ed";
        case "REJECTED": return "#fdecea";
        case "CANCELLED": return "#f0f0f0";
        default: return "#fef9ec";
    }
}

// ─── Upgrade History Panel ────────────────────────────────────────────────────

function UpgradeHistory() {
    const { data: applications, isLoading } = useMyUpgradeApplications();

    if (isLoading) return null;
    if (!applications?.length) return null;

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1px", color: "var(--iet-muted)", marginBottom: 10
            }}>
                <span>Upgrade History</span>
                <div style={{ flex: 1, height: 1, background: "var(--iet-border)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {applications.map((app) => (
                    <div key={app.id} className="card" style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                            <div>
                                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--iet-text)", margin: 0 }}>
                                    {app.fromCategory?.name ?? "—"} → {app.toCategory?.name ?? "—"}
                                </p>
                                <p style={{ fontSize: 11, color: "var(--iet-muted)", margin: "3px 0 0" }}>
                                    Submitted {new Date(app.submittedAt).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                color: statusColor(app.status), background: statusBg(app.status)
                            }}>
                                {app.status}
                            </span>
                        </div>
                        {app.status === "REJECTED" && app.rejectionReason && (
                            <p style={{ fontSize: 11.5, color: "var(--iet-red, #c0392b)", marginTop: 8, padding: "8px 10px", background: "#fdecea", borderRadius: 8 }}>
                                <strong>Rejection reason:</strong> {app.rejectionReason}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({
    category,
    selected,
    onSelect,
}: {
    category: EligibleCategory;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            style={{
                width: "100%",
                textAlign: "left",
                border: `2px solid ${selected ? "var(--iet-red, #c0392b)" : "var(--iet-border)"}`,
                borderRadius: 12,
                padding: "16px 18px",
                background: selected ? "rgba(192,57,43,0.04)" : "var(--iet-white)",
                cursor: "pointer",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
            }}
        >
            {/* Radio indicator */}
            <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                border: `2px solid ${selected ? "var(--iet-red, #c0392b)" : "var(--iet-border)"}`,
                background: selected ? "var(--iet-red, #c0392b)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s ease",
            }}>
                {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
            </div>

            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "var(--iet-text)" }}>
                    {category.name}
                </p>
                {category.description && (
                    <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--iet-muted)", lineHeight: 1.5 }}>
                        {category.description}
                    </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: "#fef9ec", color: "var(--iet-amber, #b7791f)", border: "1px solid #f9e1a0"
                    }}>
                        {category.minYearsExperience}+ years experience
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7"
                    }}>
                        {formatCurrency(category.yearlyFee)}/year
                    </span>
                    {category.minCpdPoints > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                            background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe"
                        }}>
                            {category.minCpdPoints}+ CPD points
                        </span>
                    )}
                    {category.requiredDocuments?.length > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                            background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe"
                        }}>
                            Docs: {category.requiredDocuments.join(", ")}
                        </span>
                    )}
                </div>
            </div>

            <ChevronRight size={18} style={{ color: selected ? "var(--iet-red, #c0392b)" : "var(--iet-muted)", flexShrink: 0, marginTop: 4 }} />
        </button>
    );
}

// ─── Main Upgrade Page ────────────────────────────────────────────────────────

const UpgradeMembershipPage = () => {
    const navigate = useNavigate();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { data: eligibility, isLoading: eligibilityLoading } = useUpgradeEligibility();

    const mutation = useSubmitUpgradeApplication(
        () => {
            setSubmitted(true);
            setServerError(null);
        },
        (err) => {
            if (isAxiosError(err)) {
                const msg = err.response?.data?.message ?? err.message;
                setServerError(typeof msg === "string" ? msg : "Something went wrong. Please try again.");
            } else {
                setServerError("Something went wrong. Please try again.");
            }
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCategoryId) return;
        setServerError(null);
        mutation.mutate({ toCategoryId: selectedCategoryId, applicantNotes: notes || undefined });
    };

    // ── Success State ──────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/membership")}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--iet-muted)", fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Back to Membership
                    </button>
                </div>

                <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
                    <CheckCircle2 size={52} style={{ color: "#1a6b3c", marginBottom: 16 }} />
                    <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: "var(--iet-text)" }}>
                        Application Submitted!
                    </h2>
                    <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--iet-muted)", lineHeight: 1.7 }}>
                        Your membership upgrade application is now under review by the IET Secretariat.
                        You will receive an email notification once a decision has been made.
                    </p>
                    <button
                        className="btn btn-red"
                        onClick={() => navigate("/dashboard/membership")}
                    >
                        Back to Membership
                    </button>
                </div>

                <UpgradeHistory />
            </div>
        );
    }

    // ── Loading State ──────────────────────────────────────────────────────
    if (eligibilityLoading) {
        return (
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/membership")}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--iet-muted)", fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Back to Membership
                    </button>
                </div>
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--iet-muted)", fontSize: 13 }}>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                    Checking your eligibility…
                </div>
            </div>
        );
    }

    // ── Not Eligible State ─────────────────────────────────────────────────
    if (!eligibility?.canUpgrade) {
        return (
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                    <button
                        type="button"
                        onClick={() => navigate("/dashboard/membership")}
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--iet-muted)", fontSize: 13 }}
                    >
                        <ArrowLeft size={16} /> Back to Membership
                    </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "var(--iet-text)" }}>Upgrade Membership</h1>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--iet-muted)" }}>Review your eligibility status below</p>
                </div>

                <div className="card" style={{ padding: "20px 22px", background: "#fef9ec", border: "1.5px solid #f9e1a0" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <AlertCircle size={20} style={{ color: "#b7791f", flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13.5, color: "#7c5400" }}>
                                You are not currently eligible to upgrade your membership.
                            </p>
                            {eligibility?.missingRequirements && eligibility.missingRequirements.length > 0 && (
                                <ul style={{ margin: 0, paddingLeft: 18, color: "#7c5400", fontSize: 12.5, lineHeight: 1.8 }}>
                                    {eligibility.missingRequirements.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <UpgradeHistory />
            </div>
        );
    }

    // ── Upgrade Form ───────────────────────────────────────────────────────
    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
                <button
                    type="button"
                    onClick={() => navigate("/dashboard/membership")}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--iet-muted)", fontSize: 13 }}
                >
                    <ArrowLeft size={16} /> Back to Membership
                </button>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <TrendingUp size={20} style={{ color: "var(--iet-red, #c0392b)" }} />
                    <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--iet-text)" }}>
                        Upgrade Membership
                    </h1>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--iet-muted)" }}>
                    Select a membership category to upgrade to. Only categories you are eligible for are shown.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Category selection */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-head">
                        <span className="card-title">Select Target Category</span>
                    </div>
                    <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {eligibility.eligibleCategories.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                selected={selectedCategoryId === cat.id}
                                onSelect={() => setSelectedCategoryId(cat.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Optional notes */}
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-head">
                        <span className="card-title">Additional Notes (Optional)</span>
                    </div>
                    <div className="card-body">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Provide any supporting information for your upgrade request…"
                            rows={4}
                            maxLength={1000}
                            style={{
                                width: "100%",
                                fontSize: 13,
                                color: "var(--iet-text)",
                                background: "var(--iet-bg)",
                                border: "1.5px solid var(--iet-border)",
                                borderRadius: 10,
                                padding: "10px 14px",
                                resize: "vertical",
                                boxSizing: "border-box",
                                fontFamily: "inherit",
                                outline: "none",
                            }}
                        />
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--iet-muted)", textAlign: "right" }}>
                            {notes.length}/1000
                        </p>
                    </div>
                </div>

                {/* Server error */}
                {serverError && (
                    <div style={{
                        marginBottom: 16, padding: "12px 16px", borderRadius: 10,
                        background: "#fdecea", border: "1.5px solid #f5c6c6",
                        display: "flex", gap: 10, alignItems: "flex-start"
                    }}>
                        <AlertCircle size={18} style={{ color: "#c0392b", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 13, color: "#c0392b" }}>{serverError}</p>
                    </div>
                )}

                {/* Submit */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => navigate("/dashboard/membership")}
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-red"
                        disabled={!selectedCategoryId || mutation.isPending}
                        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                                Submitting…
                            </>
                        ) : (
                            <>
                                <TrendingUp size={15} />
                                Submit Application
                            </>
                        )}
                    </button>
                </div>
            </form>

            <UpgradeHistory />
        </div>
    );
};

export default UpgradeMembershipPage;
