import {type LoaderFunctionArgs, redirect} from "react-router";
import {getCookieValue} from "~/utils/parse-cookie";


export const loader = ({ request }: LoaderFunctionArgs) => {
    const token = getCookieValue(request, "global-ut");

    if (!token) return redirect("/auth/login");

    const registrationStatus = getCookieValue(request, "global-ms");
    if (registrationStatus !== "DRAFT") return redirect("/dashboard");

    return redirect("/application");
};
