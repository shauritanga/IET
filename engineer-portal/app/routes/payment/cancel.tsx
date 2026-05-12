import { Link, useSearchParams } from "react-router";

export default function PaymentCancel() {
    const [params] = useSearchParams();
    const orderId = params.get("order_id");

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, background: "var(--iet-bg, #f5f5f5)" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "40px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.08)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#x274C;</div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>Payment Cancelled</h1>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
                    You cancelled the payment process. No charge has been made. You can try again from your dashboard whenever you are ready.
                </p>
                {orderId && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>Reference: {orderId}</p>
                )}
                <Link
                    to="/dashboard"
                    style={{ display: "inline-block", background: "#9b1c1c", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
