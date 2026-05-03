import { useNavigate } from "react-router";
import { deleteFromStorage, deleteFromCookie } from "~/utils/storage";
import { TOKEN_KEY, USER_KEY } from "~/utils/http";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {
    clearAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
} from "~/utils/otp-session";

export function useLogout() {
    const navigate = useNavigate();
    const { clearAll } = useApplicationFormStore();

    return () => {
        clearAuthSession();
        clearAll();
        deleteFromCookie(TOKEN_KEY);
        deleteFromCookie("global-rt");
        deleteFromCookie(MEMBERSHIP_STATUS_COOKIE_KEY);
        deleteFromCookie(REGISTRATION_STATUS_COOKIE_KEY);
        deleteFromStorage(USER_KEY);
        navigate("/auth/login", { replace: true });
    };
}
