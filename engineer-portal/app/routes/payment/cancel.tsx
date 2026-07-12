import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

const PAYMENT_CONTEXT_KEY = "iet_payment_context";
const PAYMENT_CANCELLED_KEY = "iet_payment_cancelled";

type PaymentContext = { type: "application"; applicationId: string } | { type: "event" } | null;

export default function PaymentCancel() {
    const [params] = useSearchParams();
    const orderId = params.get("order_id");
    const [context, setContext] = useState<PaymentContext>(null);

    useEffect(() => {
        const raw = sessionStorage.getItem(PAYMENT_CONTEXT_KEY);
        if (raw) {
            try {
                setContext(JSON.parse(raw));
            } catch {
                setContext({ type: "event" });
            }
            sessionStorage.removeItem(PAYMENT_CONTEXT_KEY);
        }
        // Signal the destination page that payment was cancelled
        sessionStorage.setItem(PAYMENT_CANCELLED_KEY, "1");
    }, []);

    const isApplication = context?.type === "application";
    const returnPath = isApplication ? "/application/submission" : "/dashboard/events/my-registrations";
    const returnLabel = isApplication ? "Return to Application" : "Continue Payment";
    const bodyText = isApplication
        ? "Your payment was cancelled. No charge has been made. Your application is still saved — you can complete payment when you are ready."
        : "Your payment was cancelled. No charge has been made. Your event registration is still pending — you can complete payment whenever you are ready from your dashboard.";

    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--iet-bg)] p-6 text-[var(--iet-text)]">
            <div className="w-full max-w-md rounded-2xl border border-[var(--iet-border)] bg-[var(--iet-white)] p-10 text-center shadow-md">
                <div className="flex justify-center mb-5">
                    <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center">
                        <svg
                            className="size-8 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="mb-2 text-xl font-bold text-[var(--iet-red-dark)]">
                    Payment Cancelled
                </h1>

                <p className="mb-6 text-sm leading-relaxed text-[var(--iet-muted)]">
                    {bodyText}
                </p>

                {orderId && (
                    <p className="mb-6 font-mono text-xs text-[var(--iet-muted)]">
                        Reference: {orderId}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to={returnPath}
                        className="inline-flex items-center justify-center rounded-lg bg-[var(--iet-button-primary-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--iet-button-primary-fg)] transition-colors hover:bg-[var(--iet-button-primary-hover)]"
                    >
                        {returnLabel}
                    </Link>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--iet-border)] px-5 py-2.5 text-sm font-semibold text-[var(--iet-text)] transition-colors hover:bg-[var(--iet-red-pale)]"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
