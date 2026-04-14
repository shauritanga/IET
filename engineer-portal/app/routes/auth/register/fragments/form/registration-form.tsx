import React, {useState} from 'react';
import {Field, FieldDescription, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {Link, useNavigate} from "react-router";
import {type RegistrationFormType, useManageRegistrationForm} from "~/routes/auth/register/fragments/form/manage-registration-form";
import {useRegisterUser} from "../../repository/handle-registration";
import {EyeClosed, Eye} from "@solar-icons/react/ssr";
import {Spinner} from "~/components/ui/spinner";


const RegistrationForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {register, handleSubmit, formState: {errors}, getValues} = useManageRegistrationForm();
    const navigate = useNavigate();

    const {mutate: registerUser, isPending} = useRegisterUser();

    const onSubmit = (values: RegistrationFormType) => {
        registerUser(values, {
            onSuccess: () => {
                navigate("/auth/verify-otp", { state: { email: values.email } });
            }
        });
    };

    return (
        <form className={"flex flex-col gap-6"} onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl md:text-2xl font-semibold">Register</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance">
                    Please create an account to continue to the platform
                </p>
            </div>
            <FieldGroup className={"flex flex-col gap-4"}>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" required {...register("email")}/>
                    <FieldError>{errors.email?.message}</FieldError>
                </Field>
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
                    {isPending ? <Spinner/> : "Register"}
                </Button>


                <FieldDescription className="text-center text-xs md:text-sm">
                    Already have an account?{" "}
                    <Link to="/auth/login" className="text-[#E20C0A] hover:underline">
                        Click here to Login
                    </Link>
                </FieldDescription>

            </FieldGroup>
        </form>
    );
};

export default RegistrationForm;