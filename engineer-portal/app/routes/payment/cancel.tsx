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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
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

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                    Payment Cancelled
                </h1>

                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    {bodyText}
                </p>

                {orderId && (
                    <p className="text-xs text-gray-400 mb-6 font-mono">
                        Reference: {orderId}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to={returnPath}
                        className="inline-flex items-center justify-center rounded-lg bg-[#9b1c1c] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#7f1d1d] transition-colors"
                    >
                        {returnLabel}
                    </Link>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 text-gray-700 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
