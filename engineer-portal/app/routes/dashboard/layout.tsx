import React from 'react';
import {SidebarProvider} from "~/components/ui/sidebar";
import AuthLayout from "~/routes/dashboard/auth-layout";
import {type LoaderFunctionArgs, redirect} from "react-router";
import {getCookieValue} from "~/utils/parse-cookie";

export const loader = ({ request }: LoaderFunctionArgs) => {
    const token = getCookieValue(request, "global-ut");

    if (!token) return redirect("/auth/login");

    return null;
};

const Layout = () => {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "16rem",
                } as React.CSSProperties
            }
        >
                <AuthLayout/>
        </SidebarProvider>
    );
};

export default Layout;
