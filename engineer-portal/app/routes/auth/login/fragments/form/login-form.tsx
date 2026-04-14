import React, {useEffect, useState} from 'react';
import {Field, FieldDescription, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Button} from "~/components/ui/button";
import {Input} from "~/components/ui/input";
import {type LoginFormType, useManageLoginForm} from "~/routes/auth/login/fragments/form/manage-login-form";
import {Link, useNavigate} from "react-router";
import {Eye, EyeClosed} from "@solar-icons/react/ssr";
import {useLoginUser} from "~/routes/auth/login/repository/handle-login";
import {useMembershipModalStore} from "~/stores/useMembershipModalStore";
import {Spinner} from "~/components/ui/spinner";

const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);

    const {register, handleSubmit} = useManageLoginForm()

    const navigate = useNavigate();

    const {open} = useMembershipModalStore();

    const {mutate: loginUser, isPending} = useLoginUser((data) => {
        navigate("/dashboard", {replace: true});
        if (
            data.user.registrationStatus === null
        ) {
            open();
        }
    });

    const onSubmit = (values: LoginFormType) => {
        loginUser(values);
    };

    const handleLogin = () => {
        handleSubmit(onSubmit)();
    };

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            console.trace("Page is unloading");
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, []);

    return (
        <form className={"flex flex-col gap-6"} onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-xl md:text-2xl font-semibold">Login</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance">
                    Please enter your registered email and password below to Sign in
                </p>
            </div>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" placeholder="m@example.com" {...register("email")}/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                        <Input
                            id="Password"
                            type={showPassword ? "text" : "password"}
                            placeholder={"********"}
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
                    <div className="flex items-center">
                        {/*<div className={"flex gap-2 items-center"}>*/}
                        {/*    <Checkbox id="remember-me"/>*/}
                        {/*    <Label htmlFor="remember-me" className={"text-xs md:text-sm"}>Remember me</Label>*/}
                        {/*</div>*/}
                        <Link to={"/auth/forgot-password"}
                              className="ml-auto text-xs md:text-sm underline-offset-4 hover:underline text-[#E20C0A]"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </Field>
                <Field>
                    <Button
                        disabled={isPending}
                        className={"bg-[#390909] hover:bg-[#390909]/90"}
                        size={"lg"}
                        type="button"
                        onClick={handleLogin}
                    >
                        {isPending ? <Spinner/> : "Login"}
                    </Button>
                </Field>
                <Field>
                    <FieldDescription className="text-center text-xs md:text-sm">
                        Don&apos;t have an account?{" "}
                        <Link to="/auth/register" className="text-[#E20C0A] hover:underline">
                            Click here to register
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
};

export default LoginForm;