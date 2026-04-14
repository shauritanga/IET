import React from 'react';
import ResetPasswordForm from "~/routes/auth/reset-password/fragments/form/reset-password-form";

const VerifyOtp = () => {
    const year = new Date().getFullYear();
    return (

        <div className="flex  flex-col gap-4 p-4 md:p-10 space-y-4 w-full justify-between">
            <div className="flex flex-col items-center justify-center gap-2">
                <a href="#" className="flex items-center gap-2 ">
                    <img src="/IET-logo.png" alt="IET-logo" className={"size-24"}/>
                </a>
                <h1 className={"max-w-62.5 font-semibold text-lg md:text-xl text-center text-[#E20C0A]"}>Institution of
                    Engineers Tanzania</h1>
            </div>
            <div className="flex items-center justify-center">
                <div className="w-full max-w-sm">
                    <ResetPasswordForm/>
                </div>
            </div>
            <div className={"text-xs text-neutral-400 text-center"}>
                <span aria-hidden="true">©</span>{" "}
                <span className="sr-only">Copyright</span>
                {` ${year} Institution of Engineers Tanzania`}
            </div>
        </div>

    );
};

export default VerifyOtp;