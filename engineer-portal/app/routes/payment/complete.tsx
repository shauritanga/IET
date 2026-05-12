import { Link, useSearchParams } from "react-router";

export default function PaymentComplete() {
    const [params] = useSearchParams();
    const orderId = params.get("order_id") ?? params.get("order_id");
    const status = (params.get("payment_status") ?? "").toUpperCase();
    const failed = status === "FAILED" || status === "CANCELLED";

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, background: "var(--iet-bg, #f5f5f5)" }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "40px 32px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.08)" }}>
                {failed ? (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>&#x26A0;</div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#b91c1c", marginBottom: 8 }}>Payment Not Completed</h1>
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
                            Your payment was not completed. No charge has been made. You can try again from your dashboard.
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>&#x2705;</div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#15803d", marginBottom: 8 }}>Payment Received</h1>
                        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
                            Your payment has been submitted and is being processed. You will receive a confirmation
                            email and SMS once it is verified. This may take a few minutes.
                        </p>
                    </>
                )}
                {orderId && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>Reference: {orderId}</p>
                )}
                <Link
                    to="/dashboard"
                    style={{ display: "inline-block", background: "#9b1c1c", color: "#fff", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
                >
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
}
