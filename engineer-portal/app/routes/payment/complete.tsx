import { Link, useSearchParams } from "react-router";

export default function PaymentComplete() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const status = (params.get("payment_status") ?? "").toUpperCase();

  const isSuccess = status === "SUCCESS" || status === "COMPLETED" || status === "PAID";
  const isFailed = status === "FAILED" || status === "CANCELLED";
  // Any other status (PENDING, empty, etc.) shows "confirming" state
  const isPending = !isSuccess && !isFailed;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--iet-bg)] p-6 text-[var(--iet-text)]">
      <div className="w-full max-w-md rounded-2xl border border-[var(--iet-border)] bg-[var(--iet-white)] p-10 text-center shadow-md">
        <div className="flex justify-center mb-5">
          {isSuccess && (
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="size-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="size-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          {isPending && (
            <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="size-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {isSuccess && (
          <>
            <h1 className="text-xl font-bold text-green-700 mb-2">Payment Received</h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--iet-muted)]">
              Your payment has been submitted and is being verified. You will receive a
              confirmation once it is processed. This may take a few minutes.
            </p>
          </>
        )}

        {isFailed && (
          <>
            <h1 className="text-xl font-bold text-red-700 mb-2">Payment Not Completed</h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--iet-muted)]">
              Your payment could not be completed. No charge has been made. You can retry
              payment from your dashboard.
            </p>
          </>
        )}

        {isPending && (
          <>
            <h1 className="text-xl font-bold text-blue-700 mb-2">Confirming Payment…</h1>
            <p className="mb-6 text-sm leading-relaxed text-[var(--iet-muted)]">
              Your payment is being verified. Please check{" "}
              <strong>My Registrations</strong> in a moment to see the updated status.
              If payment was successful, your registration will be confirmed automatically.
            </p>
          </>
        )}

        {orderId && (
          <p className="mb-6 font-mono text-xs text-[var(--iet-muted)]">Reference: {orderId}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard/events/my-registrations"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--iet-button-primary-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--iet-button-primary-fg)] transition-colors hover:bg-[var(--iet-button-primary-hover)]"
          >
            My Registrations
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--iet-border)] px-5 py-2.5 text-sm font-semibold text-[var(--iet-text)] transition-colors hover:bg-[var(--iet-red-pale)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
