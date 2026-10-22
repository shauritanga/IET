import toast from "react-hot-toast";

type Tone = "success" | "error" | "info";

const TONE_COLOR: Record<Tone, string> = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#2563eb",
};

function show(tone: Tone, title: string, description?: string) {
    return toast.custom(
        (t) => (
            <div
                role={tone === "error" ? "alert" : "status"}
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    width: "min(380px, calc(100vw - 32px))",
                    padding: 14,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderLeft: `4px solid ${TONE_COLOR[tone]}`,
                    borderRadius: 12,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
                    opacity: t.visible ? 1 : 0,
                    transform: t.visible ? "none" : "translateY(-8px)",
                    transition: "opacity .18s ease, transform .18s ease",
                }}
            >
                <span
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        marginTop: 2,
                        flexShrink: 0,
                        borderRadius: "50%",
                        background: TONE_COLOR[tone],
                        color: "#fff",
                    }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        {tone === "success" && <polyline points="20 6 9 17 4 12" />}
                        {tone === "error" && (
                            <>
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </>
                        )}
                        {tone === "info" && (
                            <>
                                <line x1="12" y1="11" x2="12" y2="17" />
                                <line x1="12" y1="7" x2="12" y2="7.01" />
                            </>
                        )}
                    </svg>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</p>
                    {description ? (
                        <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: 1.4, color: "#6b7280", wordBreak: "break-word" }}>
                            {description}
                        </p>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => toast.dismiss(t.id)}
                    aria-label="Dismiss notification"
                    style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: "#9ca3af", flexShrink: 0 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        ),
        { duration: tone === "error" ? 7000 : 4500 },
    );
}

export const notify = {
    success: (title: string, description?: string) => show("success", title, description),
    error: (title: string, description?: string) => show("error", title, description),
    info: (title: string, description?: string) => show("info", title, description),
};
