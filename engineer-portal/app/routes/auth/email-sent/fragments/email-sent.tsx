import React from 'react';
import {useLocation, useNavigate, Link} from "react-router";
import {useEffect} from "react";

const EmailSentPage = () => {
    const {state} = useLocation();
    const navigate = useNavigate();
    const email = state?.email as string | undefined;

    useEffect(() => {
        if (!email) navigate("/auth/forgot-password", {replace: true});
    }, [email, navigate]);

    if (!email) return null;

    return (
        <div className="flex flex-col gap-12">
            <div className="flex flex-col items-center gap-3 text-center">
                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#390909]/10">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 text-[#390909]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                    </svg>
                </div>

                <h1 className="text-xl md:text-2xl font-semibold">Check your email</h1>
                <p className="text-muted-foreground text-xs md:text-sm text-balance max-w-xs">
                    If an account exists for{" "}
                    <span className="font-medium text-foreground">{email}</span>
                    , you will receive a password reset instructions shortly.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <p className="text-center text-xs md:text-sm text-muted-foreground">
                    Didn't receive an email?{" "}
                    <Link
                        to="/auth/forgot-password"
                        className="text-[#E20C0A] hover:underline"
                    >
                        Try again
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default EmailSentPage;