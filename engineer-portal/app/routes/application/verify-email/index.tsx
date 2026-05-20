import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { useVerifyEmail } from "./repository/useVerifyEmail";
import { useResendCode } from "./repository/useResendCode";

const schema = z.object({
    verificationCode: z
        .string()
        .min(1, "Verification code is required")
        .regex(/^[A-Z0-9]{6}$/, "Enter the 6-character code from your email"),
});

type FormValues = z.infer<typeof schema>;

const RESEND_COOLDOWN = 60;

const VerifyEmail = () => {
    const navigate = useNavigate();
    const { data: draft } = useGetApplicationDraft();
    const email = draft?.data?.registration?.personalDetails?.email ?? "";

    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    });

    const verifyMutation = useVerifyEmail(() =>
        navigate("/application/submission", { replace: true }),
    );

    const resendMutation = useResendCode(() => {
        setCooldown(RESEND_COOLDOWN);
    });

    // Auto-send code on mount
    const hasSentRef = useRef(false);
    useEffect(() => {
        if (hasSentRef.current) return;
        hasSentRef.current = true;
        resendMutation.mutate();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        timerRef.current = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [cooldown]);

    const onSubmit = (values: FormValues) => {
        verifyMutation.mutate(values.verificationCode);
    };

    const handleResend = () => {
        if (cooldown > 0) return;
        resendMutation.mutate();
    };

    return (
        <section className="flex flex-col justify-between w-full h-full max-w-2xl space-y-12">
            <div className="space-y-6 flex-1">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[var(--iet-red-dark)] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                        Step 5 of 6
                    </div>
                    <h2
                        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                        className="text-[26px] font-bold text-[var(--iet-red-dark)] leading-tight"
                    >
                        Verify Your Email
                    </h2>
                    <p className="text-sm text-[var(--iet-muted)]">
                        A 6-character code has been sent to{" "}
                        {email ? (
                            <span className="font-semibold text-[var(--iet-text)]">{email}</span>
                        ) : (
                            "your registered email address"
                        )}
                        . Enter it below to continue.
                    </p>
                </div>

                <div className="bg-[var(--iet-white)] rounded-2xl border border-[var(--iet-border)] shadow-[var(--shadow-md)] p-6 md:p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Field>
                            <FieldLabel htmlFor="verificationCode">Verification Code</FieldLabel>
                            <Input
                                id="verificationCode"
                                type="text"
                                placeholder="ABC123"
                                autoComplete="one-time-code"
                                className="font-mono tracking-[0.25em] text-center uppercase text-lg"
                                maxLength={6}
                                {...register("verificationCode", {
                                    setValueAs: (v: string) => v.toUpperCase().trim(),
                                })}
                            />
                            {errors.verificationCode && (
                                <FieldError>{errors.verificationCode.message}</FieldError>
                            )}
                        </Field>

                        <button
                            type="submit"
                            disabled={verifyMutation.isPending}
                            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--iet-red-mid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {verifyMutation.isPending ? <Spinner className="size-4" /> : "Verify & Continue →"}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-[var(--iet-muted)]">
                            Didn&apos;t receive the code?{" "}
                            {cooldown > 0 ? (
                                <span className="font-medium text-[var(--iet-muted)]">
                                    Resend in {cooldown}s
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendMutation.isPending}
                                    className="font-semibold text-[var(--iet-red)] hover:underline disabled:opacity-50"
                                >
                                    {resendMutation.isPending ? "Sending…" : "Resend code"}
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-full flex items-center justify-between">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/application/references")}
                >
                    ← Back
                </Button>
                <div className="hidden lg:block" />
            </div>
        </section>
    );
};

export default VerifyEmail;
