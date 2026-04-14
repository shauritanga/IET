import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

type Callback = () => void;

type TUseOpenAndCloseModalBasedRoute = {
    open: boolean;
    closeModal: () => void;
};

interface IUseRouteModal {
    callback?: Callback;
    navigateTo?: {
        url: string;
        replace?: boolean;
    };
}

const useRouteModal = (
    options?: IUseRouteModal
): TUseOpenAndCloseModalBasedRoute => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setOpen(false);

        setTimeout(() => {
            if (options?.callback) {
                options.callback();
            }
            if (options?.navigateTo) {
                navigate(options.navigateTo.url, {
                    replace: !!options?.navigateTo?.replace,
                });
            } else {
                navigate(-1);
            }
        }, 300);
    }, [navigate, options]);

    return { closeModal, open };
};

export default useRouteModal;
