import {type LoaderFunctionArgs, redirect} from "react-router";
import {getCookieValue} from "~/utils/parse-cookie";
import {REGISTRATION_STATUS_COOKIE_KEY} from "~/utils/otp-session";


export const loader = ({ request }: LoaderFunctionArgs) => {
    const token = getCookieValue(request, "global-ut");

    if (!token) return redirect("/auth/login");

    const registrationStatus = getCookieValue(request, REGISTRATION_STATUS_COOKIE_KEY);
    if (registrationStatus !== "DRAFT") return redirect("/dashboard");

    return redirect("/application");
};
