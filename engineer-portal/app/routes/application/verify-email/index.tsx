import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Spinner } from "~/components/ui/spinner";

/**
 * Email verification happens at signup.
 * Keep this route only to redirect old bookmarks into the current flow.
 */
const VerifyEmail = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/application/review", { replace: true });
    }, [navigate]);

    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <Spinner className="size-8" />
        </div>
    );
};

export default VerifyEmail;
