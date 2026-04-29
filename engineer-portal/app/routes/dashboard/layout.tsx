import AuthLayout from "~/routes/dashboard/auth-layout"
import { type LoaderFunctionArgs, redirect } from "react-router"
import { getCookieValue } from "~/utils/parse-cookie"

export const loader = ({ request }: LoaderFunctionArgs) => {
    // const token = getCookieValue(request, "global-ut")
    // if (!token) return redirect("/auth/login")
    return null
}

const Layout = () => <AuthLayout />

export default Layout
