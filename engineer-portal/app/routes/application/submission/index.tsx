import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Checkbox } from "~/components/ui/checkbox";
import { Field, FieldError } from "~/components/ui/field";
import { BirthDatePicker } from "~/components/custom/birth-date-picker";
import { Spinner } from "~/components/ui/spinner";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { useManageDeclarationForm, type DeclarationFormType } from "./form/manage-declaration-form";
import { useSubmitDeclaration } from "./repository/useSubmitDeclaration";
import { useApplicationPaymentStatus } from "./repository/useApplicationPaymentStatus";
import { useInitiateApplicationPayment } from "./repository/useInitiateApplicationPayment";
import type { ApplicationPaymentMethod } from "~/routes/application/type";

const methodLabels: Record<ApplicationPaymentMethod, string> = {
    TIGO_PESA: "Mixx by Yas",
    HALOPESA: "Halopesa",
    AIRTEL_MONEY: "Airtel Money",
    SELCOM: "Card Payment",
};

const mobileMethods: ApplicationPaymentMethod[] = ["TIGO_PESA", "HALOPESA", "AIRTEL_MONEY"];

const normalizeClickPesaPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith("255") && digits.length === 12) {
        return digits;
    }

    if (digits.startsWith("0") && digits.length === 10) {
        return `255${digits.slice(1)}`;
    }

    if (digits.length === 9) {
        return `255${digits}`;
    }

    return digits;
};

const Submission = () => {
    const navigate = useNavigate();
    const { data: draft } = useGetApplicationDraft();
    const paymentQuery = useApplicationPaymentStatus();
    const paymentMutation = useInitiateApplicationPayment();
    const declarationMutation = useSubmitDeclaration(() =>
        navigate("/application/welcome", { replace: true }),
    );

    const { handleSubmit, control, formState: { errors } } = useManageDeclarationForm();

    const registrationCategory =
        draft?.data.registration?.registrationDetails?.registrationCategory === "GRADUATE"
            ? "GRADUATE"
            : "STANDARD";

    const [applicationType, setApplicationType] = useState<"GRADUATE" | "STANDARD">(registrationCategory);
    const [paymentMethod, setPaymentMethod] = useState<ApplicationPaymentMethod>("TIGO_PESA");
    const [phoneNumber, setPhoneNumber] = useState(
        draft?.data.registration?.personalDetails?.phoneNumber ?? "",
    );

    useEffect(() => {
        setApplicationType(registrationCategory);
    }, [registrationCategory]);

    useEffect(() => {
        if (!phoneNumber && draft?.data.registration?.personalDetails?.phoneNumber) {
            setPhoneNumber(draft.data.registration.personalDetails.phoneNumber);
        }
    }, [draft?.data.registration?.personalDetails?.phoneNumber, phoneNumber]);

    const paymentState = paymentQuery.data?.data;
    const paymentCompleted = Boolean(
        paymentState?.paymentCompleted || draft?.data.registration?.paymentCompleted,
    );
    const amount =
        paymentState?.amount ??
        (applicationType === "GRADUATE" ? 5000 : 10000);

    const submitDeclaration = (value: DeclarationFormType) => {
        declarationMutation.mutate(value);
    };

    const handlePayNow = () => {
        const normalizedPhoneNumber = normalizeClickPesaPhoneNumber(phoneNumber);

        if (mobileMethods.includes(paymentMethod) && !phoneNumber.trim()) {
            toast.error("Phone number is required for mobile money payments.");
            return;
        }

        if (
            mobileMethods.includes(paymentMethod) &&
            !/^255\d{9}$/.test(normalizedPhoneNumber)
        ) {
            toast.error("Use phone number format 255XXXXXXXXX.");
            return;
        }

        paymentMutation.mutate(
            {
                applicationType,
                paymentMethod,
                phoneNumber: mobileMethods.includes(paymentMethod)
                    ? normalizedPhoneNumber
                    : undefined,
            },
            {
                onSuccess: (response) => {
                    if (response.data.paymentUrl) {
                        window.open(response.data.paymentUrl, "_blank", "noopener,noreferrer");
                    } else {
                        toast.success("Payment request sent. Please check your phone to confirm.");
                    }
                },
            },
        );
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {!paymentCompleted ? (
                <section className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[var(--iet-red-dark)] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                            Step 5 of 5
                        </div>
                        <h2 style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="text-[26px] font-bold text-[var(--iet-red-dark)] leading-tight">Complete Payment to Continue</h2>
                        <p className="text-[13px] text-[var(--iet-muted)]">
                            Complete payment to submit your application.
                        </p>
                    </div>

                    <div className="bg-[var(--iet-white)] rounded-2xl border border-[var(--iet-border)] shadow-[var(--shadow-md)] p-6 md:p-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-[var(--iet-red-dark)]">Select Application Type</p>
                            <div className="inline-flex rounded-xl bg-[var(--iet-bg)] p-1">
                                {[
                                    { value: "GRADUATE", label: "Graduate" },
                                    { value: "STANDARD", label: "Others" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setApplicationType(option.value as "GRADUATE" | "STANDARD")}
                                        className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
                                            applicationType === option.value
                                                ? "bg-[var(--iet-red-pale)] text-[var(--iet-red)]"
                                                : "text-[var(--iet-muted)]"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="border-b border-[var(--iet-border)] pb-3 text-xs font-semibold tracking-[0.16em] text-[var(--iet-muted)]">
                                MOBILE NETWORKS
                            </p>
                            <div className="space-y-3">
                                {mobileMethods.map((method) => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method)}
                                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left ${
                                            paymentMethod === method
                                                ? "border-[var(--iet-red)] bg-[var(--iet-white)]"
                                                : "border-[var(--iet-border)] bg-[var(--iet-bg)]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`h-3.5 w-3.5 rounded-full border ${
                                                paymentMethod === method
                                                    ? "border-[var(--iet-red)] bg-[var(--iet-red)]"
                                                    : "border-neutral-300"
                                            }`} />
                                            <span className="font-medium text-[var(--iet-red-dark)]">{methodLabels[method]}</span>
                                        </div>
                                        <span className="text-sm text-[var(--iet-muted)]">{paymentMethod === method ? "Selected" : ""}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="border-b border-[var(--iet-border)] pb-3 text-xs font-semibold tracking-[0.16em] text-[var(--iet-muted)]">
                                CREDIT CARD
                            </p>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("SELCOM")}
                                className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left ${
                                    paymentMethod === "SELCOM"
                                        ? "border-[var(--iet-red)] bg-[var(--iet-white)]"
                                        : "border-[var(--iet-border)] bg-[var(--iet-bg)]"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`h-3.5 w-3.5 rounded-full border ${
                                        paymentMethod === "SELCOM"
                                            ? "border-[var(--iet-red)] bg-[var(--iet-red)]"
                                            : "border-neutral-300"
                                    }`} />
                                    <span className="font-medium text-[var(--iet-red-dark)]">Card Payment</span>
                                </div>
                                <span className="text-sm text-[var(--iet-muted)]">Powered by Selcom</span>
                            </button>
                        </div>

                        <div className="rounded-2xl bg-[var(--iet-bg)] p-5">
                            <p className="text-sm text-[var(--iet-muted)]">
                                {mobileMethods.includes(paymentMethod)
                                    ? "Pay directly from the website and you will receive a payment verification prompt to complete the transaction."
                                    : "You will be redirected to complete the payment securely through ClickPesa card checkout."}
                            </p>

                            <div className="mt-4 rounded-xl bg-[var(--iet-white)] border border-[var(--iet-border)] p-4">
                                <p className="text-sm font-semibold text-[var(--iet-red-dark)]">Payment Summary</p>
                                <div className="mt-3 space-y-3 text-sm">
                                    <div className="flex items-center justify-between border-b border-[var(--iet-border)] pb-3">
                                        <span>{applicationType === "GRADUATE" ? "Graduate Application" : "Standard Application"}</span>
                                        <span>{amount.toLocaleString()} TZS</span>
                                    </div>
                                    <div className="flex items-center justify-between font-semibold text-[var(--iet-red-dark)]">
                                        <span>Total Fee</span>
                                        <span>{amount.toLocaleString()} TZS</span>
                                    </div>
                                </div>
                            </div>

                            {mobileMethods.includes(paymentMethod) && (
                                <div className="mt-4 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.7px] text-[var(--iet-muted)]">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(event) => setPhoneNumber(event.target.value)}
                                        placeholder="e.g. 255712000000"
                                        className="w-full rounded-lg border-[1.5px] border-[var(--iet-border)] bg-[var(--iet-white)] px-3 py-2 text-[12.5px] text-[var(--iet-text)] outline-none transition-[border-color,background] placeholder:text-[var(--iet-muted)] focus:border-[var(--iet-red)] focus:bg-[var(--iet-white)]"
                                    />
                                    <p className="text-xs text-[var(--iet-muted)]">
                                        Use the format <span className="font-medium">255XXXXXXXXX</span>.
                                    </p>
                                </div>
                            )}

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
                                    {paymentMutation.isPending ? <Spinner className="size-4" /> : "Pay Now"}
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
                            Step 5 of 5
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

                            <Field>
                                <Controller
                                    name="declarationDate"
                                    control={control}
                                    render={({ field }) => (
                                        <BirthDatePicker
                                            placeholder="MM-DD-YYYY"
                                            value={field.value ? new Date(field.value) : undefined}
                                            onChange={(date) => field.onChange(date?.toISOString() ?? "")}
                                        />
                                    )}
                                />
                                {errors.declarationDate && (
                                    <FieldError>{errors.declarationDate.message}</FieldError>
                                )}
                            </Field>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-2">
                        <Link to="/application/references">
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
