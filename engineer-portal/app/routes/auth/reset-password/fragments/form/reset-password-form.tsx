import React, {useState} from 'react';
import {Field,  FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {useNavigate} from "react-router";
import {EyeClosed, Eye} from "@solar-icons/react/ssr";
import {
    type ResetPasswordFormType,
    useManageResetPasswordForm
} from "~/routes/auth/reset-password/fragments/form/manage-reset-password-form";
import {useResetPassword} from "~/routes/auth/reset-password/repository/handle-reset-password";


const RegistrationForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {register, handleSubmit, formState: {errors}} = useManageResetPasswordForm();
    const navigate = useNavigate();

    const {mutate: resetPassword, isPending} = useResetPassword();

    const onSubmit = (values: ResetPasswordFormType) => {
        resetPassword(values, {
            onSuccess: () => {
                navigate("/auth/login");
            }
        });
    };

    return (
        <form className={"flex flex-col gap-6"} onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl md:text-2xl font-semibold">Reset Password</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance">
                    Enter your new password below to reset your account password. Make sure it’s strong and secure.
                </p>
            </div>
            <FieldGroup className={"flex flex-col gap-4"}>
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder={"********"}
                            required
                            {...register("password")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm"
                        >
                            {showPassword ? <EyeClosed/> : <Eye/>}
                        </button>
                    </div>
                    <FieldError>{errors.password?.message}</FieldError>
                </Field>
                <Field>
                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={"********"}
                            required
                            {...register("confirmPassword")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm"
                        >
                            {showConfirmPassword ? <EyeClosed/> : <Eye/>}
                        </button>
                    </div>
                    <FieldError>{errors.confirmPassword?.message}</FieldError>
                </Field>
                <Button
                    className={"bg-[#390909] hover:bg-[#390909]/90"}
                    size={"lg"}
                    type="submit"
                    disabled={isPending}
                >
                    {isPending ? "Login..." : "Reset Password"}
                </Button>

            </FieldGroup>
        </form>
    );
};

export default RegistrationForm;