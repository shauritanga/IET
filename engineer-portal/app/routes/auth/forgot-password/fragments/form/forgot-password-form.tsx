import React from 'react';
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {
    type ForgotPasswordFormType,
    useManageForgotPasswordForm
} from "~/routes/auth/forgot-password/fragments/form/manage-forgot-password-form";
import {useForgotPassword} from "~/routes/auth/forgot-password/repository/handle-forgot-password";
import {Link, useNavigate} from "react-router";


const ForgotPasswordForm = () => {

    const {handleSubmit, formState: {errors}, register} = useManageForgotPasswordForm()
    const navigate = useNavigate();

    const {mutate: forgotPassword, isPending} = useForgotPassword();

    const onSubmit = (values: ForgotPasswordFormType) => {
        forgotPassword(values, {
            onSuccess: () => {
                navigate("/auth/email-sent", {state: {email: values.email}});
            }
        })
    };

    return (
        <form className={"flex flex-col gap-12"} onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl md:text-2xl font-semibold">Forgot Password</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance">
                    Enter your email address and we’ll send you a code to reset your password.
                </p>
            </div>
            <FieldGroup className={"flex items-center flex-col gap-12"}>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" required {...register("email")}/>
                    <FieldError>{errors.email?.message}</FieldError>
                </Field>
                <div className="flex items-center flex-col w-full gap-4">
                    <Button
                        className={"w-full bg-[#390909] hover:bg-[#390909]/90"}
                        size={"lg"}
                        type="submit"
                        disabled={isPending}
                    >
                        {isPending ? "Loading..." : "Reset Password"}
                    </Button>
                </div>
                <FieldDescription className="text-center text-xs md:text-sm">
                    Remembered you password?{" "}
                    <Link to="/auth/login" className="text-[#E20C0A] hover:underline">
                        Go back to login
                    </Link>
                </FieldDescription>
            </FieldGroup>
        </form>
    );
};

export default ForgotPasswordForm;