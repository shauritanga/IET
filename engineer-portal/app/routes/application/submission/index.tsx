import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/button";
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
        (applicationType === "GRADUATE" ? 500 : 1000);

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
                    }
                },
            },
        );
    };

    return (
        <div className="flex flex-col justify-between w-full h-full max-w-3xl space-y-10">
            {!paymentCompleted ? (
                <section className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#390909]">Complete Payment to Continue</h2>
                        <p className="text-sm text-neutral-500">
                            Complete payment to submit your application.
                        </p>
                    </div>

                    <div className="space-y-6 rounded-2xl bg-[#F8F4F4] p-5 lg:p-8">
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-[#390909]">Select Application Type</p>
                            <div className="inline-flex rounded-xl bg-[#ECE3E3] p-1">
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
                                                ? "bg-[#FDE8E7] text-[#E44C3C]"
                                                : "text-neutral-500"
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="border-b border-[#E6DDDD] pb-3 text-xs font-semibold tracking-[0.16em] text-neutral-500">
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
                                                ? "border-[#E44C3C] bg-white"
                                                : "border-[#EEE6E6] bg-[#FBF8F8]"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`h-3.5 w-3.5 rounded-full border ${
                                                paymentMethod === method
                                                    ? "border-[#E44C3C] bg-[#E44C3C]"
                                                    : "border-neutral-300"
                                            }`} />
                                            <span className="font-medium text-[#390909]">{methodLabels[method]}</span>
                                        </div>
                                        <span className="text-sm text-neutral-400">{paymentMethod === method ? "Selected" : ""}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="border-b border-[#E6DDDD] pb-3 text-xs font-semibold tracking-[0.16em] text-neutral-500">
                                CREDIT CARD
                            </p>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod("SELCOM")}
                                className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left ${
                                    paymentMethod === "SELCOM"
                                        ? "border-[#E44C3C] bg-white"
                                        : "border-[#EEE6E6] bg-[#FBF8F8]"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`h-3.5 w-3.5 rounded-full border ${
                                        paymentMethod === "SELCOM"
                                            ? "border-[#E44C3C] bg-[#E44C3C]"
                                            : "border-neutral-300"
                                    }`} />
                                    <span className="font-medium text-[#390909]">Card Payment</span>
                                </div>
                                <span className="text-sm text-neutral-400">Powered by ClickPesa</span>
                            </button>
                        </div>

                        <div className="rounded-2xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-neutral-500">
                                {mobileMethods.includes(paymentMethod)
                                    ? "Pay directly from the website and you will receive a payment verification prompt to complete the transaction."
                                    : "You will be redirected to complete the payment securely through ClickPesa card checkout."}
                            </p>

                            <div className="mt-4 rounded-xl bg-[#F8F4F4] p-4">
                                <p className="text-sm font-semibold text-[#390909]">Payment Summary</p>
                                <div className="mt-3 space-y-3 text-sm">
                                    <div className="flex items-center justify-between border-b border-[#DED5D5] pb-3">
                                        <span>{applicationType === "GRADUATE" ? "Graduate Application" : "Standard Application"}</span>
                                        <span>{amount.toLocaleString()} TZS</span>
                                    </div>
                                    <div className="flex items-center justify-between font-semibold text-[#390909]">
                                        <span>Total Fee</span>
                                        <span>{amount.toLocaleString()} TZS</span>
                                    </div>
                                </div>
                            </div>

                            {mobileMethods.includes(paymentMethod) && (
                                <div className="mt-4 space-y-2">
                                    <label className="text-sm font-medium text-[#390909]">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(event) => setPhoneNumber(event.target.value)}
                                        placeholder="e.g. 255712000000"
                                        className="w-full rounded-xl border border-[#E5DCDC] px-4 py-3 outline-none transition focus:border-[#E44C3C]"
                                    />
                                    <p className="text-xs text-neutral-500">
                                        Use the format <span className="font-medium">255XXXXXXXXX</span>.
                                    </p>
                                </div>
                            )}

                            {paymentState?.message && (
                                <div className="mt-4 rounded-xl bg-[#FDF1F0] px-4 py-3 text-sm text-[#9B3B32]">
                                    {paymentState.message}
                                </div>
                            )}

                            <div className="mt-5 flex justify-end">
                                <Button
                                    type="button"
                                    size="lg"
                                    onClick={handlePayNow}
                                    disabled={paymentMutation.isPending || paymentQuery.isFetching}
                                >
                                    {paymentMutation.isPending ? <Spinner /> : "Pay Now"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <form className="space-y-10" onSubmit={handleSubmit(submitDeclaration)}>
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-[#390909]">Declaration & Submission</h2>
                            <p className="text-sm text-neutral-500">Review and complete your final submission.</p>
                        </div>

                        <div className="space-y-6 pt-6">
                            <div className="rounded-2xl border border-[#EFE6E6] bg-white p-5">
                                <p className="text-sm text-neutral-500">
                                    I, the undersigned, agree that in the event of election as a Member of the Institution
                                    of Engineers Tanzania (IET), I will abide by the Constitution and Bye-laws of the Institution
                                    and will promote its objectives. I also certify that the information provided is true and
                                    correct to the best of my knowledge.
                                </p>
                            </div>

                            <div className="space-y-4 rounded-2xl bg-white p-5">
                                <Field className="max-w-md">
                                    <span>Applicant Signature</span>
                                    <Controller
                                        name="declarationAgreed"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="text-sm flex items-center gap-2">
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
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
                    </div>

                    <div className="flex items-center justify-between">
                        <Link to="/application/references">
                            <Button size="lg" type="button">Back</Button>
                        </Link>
                        <Button type="submit" size="lg" disabled={declarationMutation.isPending}>
                            {declarationMutation.isPending ? <Spinner /> : "Complete Application"}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Submission;
