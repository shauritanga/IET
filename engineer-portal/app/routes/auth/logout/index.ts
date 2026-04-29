import { useNavigate } from "react-router";
import { deleteFromStorage, deleteFromCookie } from "~/utils/storage";
import { TOKEN_KEY, USER_KEY } from "~/utils/http";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import { clearAuthSession } from "~/utils/otp-session";

export function useLogout() {
    const navigate = useNavigate();
    const { clearAll } = useApplicationFormStore();

    return () => {
        clearAuthSession();
        clearAll();
        deleteFromCookie(TOKEN_KEY);
        deleteFromCookie("global-rt");
        deleteFromCookie("global-ms");
        deleteFromStorage(USER_KEY);
        navigate("/auth/login", { replace: true });
    };
}
