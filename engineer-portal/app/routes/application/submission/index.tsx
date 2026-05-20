import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { useManageDeclarationForm, type DeclarationFormType } from "./form/manage-declaration-form";
import { useSubmitDeclaration } from "./repository/useSubmitDeclaration";
import { useApplicationPaymentStatus } from "./repository/useApplicationPaymentStatus";
import { useInitiateApplicationPayment } from "./repository/useInitiateApplicationPayment";

const PAYMENT_CONTEXT_KEY = "iet_payment_context";
const PAYMENT_CANCELLED_KEY = "iet_payment_cancelled";

const Submission = () => {
    const navigate = useNavigate();
    const { data: draft } = useGetApplicationDraft();
    const paymentQuery = useApplicationPaymentStatus();
    const paymentMutation = useInitiateApplicationPayment();
    const declarationMutation = useSubmitDeclaration(() =>
        navigate("/application/welcome", { replace: true }),
    );

    const { handleSubmit, control, formState: { errors } } = useManageDeclarationForm();

    // Read application type from backend — not user-selectable to prevent fee mismatch
    const backendCategory =
        draft?.data?.registration?.registrationDetails?.registrationCategory;
    const applicationType: "GRADUATE" | "STANDARD" =
        backendCategory === "GRADUATE" ? "GRADUATE" : "STANDARD";

    // Detect returned-from-cancelled payment
    const [showCancelledBanner, setShowCancelledBanner] = useState(false);
    useEffect(() => {
        const wasCancelled = sessionStorage.getItem(PAYMENT_CANCELLED_KEY);
        if (wasCancelled) {
            setShowCancelledBanner(true);
            sessionStorage.removeItem(PAYMENT_CANCELLED_KEY);
        }
    }, []);

    const paymentState = paymentQuery.data?.data;
    const paymentCompleted = Boolean(
        paymentState?.paymentCompleted || draft?.data?.registration?.paymentCompleted,
    );
    const amount =
        paymentState?.amount ??
        (applicationType === "GRADUATE" ? 5000 : 10000);

    const submitDeclaration = (value: DeclarationFormType) => {
        declarationMutation.mutate(value);
    };

    const handlePayNow = () => {
        // Store context so cancel page knows where to return
        if (draft?.data?.applicationId) {
            sessionStorage.setItem(
                PAYMENT_CONTEXT_KEY,
                JSON.stringify({ type: "application", applicationId: draft.data.applicationId }),
            );
        }

        paymentMutation.mutate(
            {
                applicationType,
                paymentMethod: "SELCOM",
            },
            {
                onSuccess: (response) => {
                    if (response.data.paymentUrl) {
                        window.location.href = response.data.paymentUrl;
                    } else {
                        toast.success("Payment request created. Please continue through Selcom.");
                    }
                },
            },
        );
    };

    const todayDisplay = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex flex-col gap-6 w-full">
            {!paymentCompleted ? (
                <section className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[var(--iet-red-dark)] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                            Step 6 of 6
                        </div>
                        <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-[26px] font-bold text-[var(--iet-red-dark)] leading-tight">Complete Payment to Continue</h2>
                        <p className="text-[13px] text-[var(--iet-muted)]">
                            Complete payment to submit your application.
                        </p>
                    </div>

                    {showCancelledBanner && (
                        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3">
                            <svg className="size-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Payment cancelled</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                                    No charge was made. Click <strong>Pay Now</strong> below to try again.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCancelledBanner(false)}
                                className="text-amber-600 hover:text-amber-800 text-lg leading-none"
                                aria-label="Dismiss"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    <div className="bg-[var(--iet-white)] rounded-2xl border border-[var(--iet-border)] shadow-[var(--shadow-md)] p-6 md:p-8">
                        <div className="space-y-6">
                            {/* Application type — read-only from backend */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-[var(--iet-red-dark)]">Application Type</p>
                                <div className="inline-flex items-center gap-2 rounded-xl bg-[var(--iet-bg)] border border-[var(--iet-border)] px-4 py-2.5">
                                    <span className="h-2 w-2 rounded-full bg-[var(--iet-red)]" />
                                    <span className="text-sm font-medium text-[var(--iet-text)]">
                                        {applicationType === "GRADUATE" ? "Graduate Member" : "Standard Member"}
                                    </span>
                                    <span className="text-xs text-[var(--iet-muted)] ml-1">(set in registration details)</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="border-b border-[var(--iet-border)] pb-3 text-xs font-semibold tracking-[0.16em] text-[var(--iet-muted)]">
                                    PAYMENT METHOD
                                </p>
                                <div className="flex w-full items-center justify-between rounded-xl border border-[var(--iet-red)] bg-[var(--iet-white)] px-4 py-4 text-left">
                                    <div className="flex items-center gap-3">
                                        <span className="h-3.5 w-3.5 rounded-full border border-[var(--iet-red)] bg-[var(--iet-red)]" />
                                        <span className="font-medium text-[var(--iet-red-dark)]">Selcom Checkout</span>
                                    </div>
                                    <span className="text-sm text-[var(--iet-muted)]">Powered by Selcom</span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-[var(--iet-bg)] p-5">
                                <p className="text-sm text-[var(--iet-muted)]">
                                    You will be redirected to Selcom's secure checkout page to complete your payment.
                                </p>

                                <div className="mt-4 rounded-xl bg-[var(--iet-white)] border border-[var(--iet-border)] p-4">
                                    <p className="text-sm font-semibold text-[var(--iet-red-dark)]">Payment Summary</p>
                                    <div className="mt-3 space-y-3 text-sm">
                                        <div className="flex items-center justify-between border-b border-[var(--iet-border)] pb-3">
                                            <span>{applicationType === "GRADUATE" ? "Graduate Application Fee" : "Standard Application Fee"}</span>
                                            <span>{amount.toLocaleString()} TZS</span>
                                        </div>
                                        <div className="flex items-center justify-between font-semibold text-[var(--iet-red-dark)]">
                                            <span>Total Fee</span>
                                            <span>{amount.toLocaleString()} TZS</span>
                                        </div>
                                    </div>
                                </div>

                                {paymentState?.message && (
                                    <div className="mt-4 rounded-xl bg-[var(--iet-red-pale)] px-4 py-3 text-sm text-[var(--iet-red-dark)]">
                                        {paymentState.message}
                                    </div>
                                )}

                                <div className="mt-5 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handlePayNow}
                                        disabled={paymentMutation.isPending || paymentQuery.isFetching}
                                        className="inline-flex items-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--iet-red-mid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        {paymentMutation.isPending ? <Spinner className="size-4" /> : "Pay Now →"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <form className="flex flex-col gap-6" onSubmit={handleSubmit(submitDeclaration)}>
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[var(--iet-red-dark)] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                            Step 6 of 6
                        </div>
                        <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-[26px] font-bold text-[var(--iet-red-dark)] leading-tight">Declaration & Submission</h2>
                        <p className="text-[13px] text-[var(--iet-muted)]">Review and complete your final submission.</p>
                    </div>

                    {/* White Card */}
                    <div className="bg-[var(--iet-white)] rounded-2xl border border-[var(--iet-border)] shadow-[var(--shadow-md)] p-6 md:p-8 space-y-6">
                        <div className="rounded-xl border border-[var(--iet-border)] bg-[var(--iet-bg)] p-5">
                            <p className="text-sm text-[var(--iet-muted)] leading-relaxed">
                                I, the undersigned, agree that in the event of election as a Member of the Institution
                                of Engineers Tanzania (IET), I will abide by the Constitution and Bye-laws of the Institution
                                and will promote its objectives. I also certify that the information provided is true and
                                correct to the best of my knowledge.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[1.2px] text-[var(--iet-muted)]">Applicant Signature</p>
                            <Field className="max-w-md">
                                <Controller
                                    name="declarationAgreed"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="text-sm flex items-center gap-2">
                                            <Checkbox
                                                checked={field.value === true}
                                                onCheckedChange={(checked) => field.onChange(checked === true ? true : null)}
                                            />
                                            <span>I agree to adhere to these precautions</span>
                                        </div>
                                    )}
                                />
                                {errors.declarationAgreed && (
                                    <FieldError>{errors.declarationAgreed.message}</FieldError>
                                )}
                            </Field>

                            {/* Declaration date — always today, read-only */}
                            <Field>
                                <Controller
                                    name="declarationDate"
                                    control={control}
                                    render={() => (
                                        <div className="flex items-center gap-2 rounded-xl border border-[var(--iet-border)] bg-[var(--iet-bg)] px-4 py-2.5 text-sm text-[var(--iet-muted)]">
                                            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Date of declaration: <strong className="text-[var(--iet-text)]">{todayDisplay}</strong></span>
                                        </div>
                                    )}
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2">
                        <Link to="/application/verify-email">
                            <button type="button" className="inline-flex items-center gap-2 border border-[var(--iet-border)] bg-[var(--iet-white)] text-[var(--iet-red-dark)] px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-[var(--iet-red)] hover:text-[var(--iet-red)] transition-colors">
                                ← Back
                            </button>
                        </Link>
                        <button type="submit" disabled={declarationMutation.isPending} className="inline-flex items-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--iet-red-mid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                            {declarationMutation.isPending ? <Spinner className="size-4" /> : null}
                            Complete Application →
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Submission;
