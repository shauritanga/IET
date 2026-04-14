import React, { useEffect } from 'react';
import {Field, FieldError, FieldGroup} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { useLocation, useNavigate } from "react-router";
import {
    type VerifyOtpFormType,
    useManageVerifyOtpForm,
} from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";
import { InputOTP, InputOTPSlot } from "~/components/ui/input-otp";
import {useVerifyEmail} from "~/routes/auth/verify-otp/repository/handle-verify-otp";
import { formatTimer } from "~/utils/format-timer";
import {useVerifyOtpStore} from "~/routes/auth/verify-otp/store/useVerifyOtpStore";
import {useMembershipModalStore} from "~/stores/useMembershipModalStore";
import {Spinner} from "~/components/ui/spinner";
import {useResendOtp} from "~/routes/auth/verify-otp/repository/handle-resend-otp";

const VerifyOtpForm = () => {
    const { Controller, control, handleSubmit, formState:errors } = useManageVerifyOtpForm();
    const navigate = useNavigate();
    const { state } = useLocation();
    const email = state?.email as string | undefined;

    const { timer, canResend, tick, triggerResend, reset } = useVerifyOtpStore()

    const { open } = useMembershipModalStore();

    const { mutate: verify, isPending } = useVerifyEmail((_data) => {
        navigate("/dashboard", { replace: true });
        if (
            _data.user.registrationStatus === null
        ) {
            open();
        }
    });

    const onSubmit = (values: VerifyOtpFormType) => {
        verify({ email: email!, code: `IET-${values.code}` });
    };

    const {mutate: resendOtp, isPending: isResendingOtp} = useResendOtp(() => {
        triggerResend();
    });

    const handleResend = () => {
        if (!canResend || isResendingOtp) return;
        resendOtp({ email: email! });
    };

    if (!email) return null;

    // Guard
    useEffect(() => {
        if (!email) navigate("/auth/register", { replace: true });
        return () => reset();
    }, [email, navigate, reset]);

    // Countdown tick
    useEffect(() => {
        if (canResend) return;
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [canResend, tick]);

    return (
        <form className={"flex flex-col gap-12"} onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl md:text-2xl font-semibold">Verify OTP</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance">
                    Please enter the code sent to{" "}
                    <span className="font-medium text-foreground">{email}</span>{" "}
                    to verify your account.
                </p>
            </div>
            <FieldGroup className={"flex items-center flex-col gap-12"}>
                <Field className={"flex items-center flex-col"}>
                    <Controller
                        name="code"
                        control={control}
                        rules={{ required: "OTP is required" }}
                        render={({ field }) => (
                            <InputOTP
                                containerClassName={"flex justify-center w-full"}
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                            >
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTP>
                        )}
                    />
                    <FieldError>{errors.code?.message}</FieldError>
                </Field>
                <div className="flex items-center flex-col w-full gap-4">
                    <Button
                        className={"w-full bg-[#390909] hover:bg-[#390909]/90"}
                        size={"lg"}
                        type="submit"
                        disabled={isPending || isResendingOtp}
                    >
                        {isPending ? <Spinner/> : "Verify"}
                    </Button>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || isResendingOtp}
                        className={`w-full text-sm ${
                            canResend ? "text-[#E20C0A] cursor-pointer" : "text-gray-400 cursor-not-allowed"
                        } hover:underline`}
                    >
                        {isResendingOtp
                            ? <span className={"text-gray-400"}>Resending...</span>
                            : canResend
                                ? "Resend Code"
                                : `Resend in ${formatTimer(timer)}`
                        }
                    </button>
                </div>
            </FieldGroup>
        </form>
    );
};

export default VerifyOtpForm;