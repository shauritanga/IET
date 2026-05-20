import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { TErrorMessage } from "~/types/types";
import { verifyApplicationEmail } from "../requests/verify-email";

export function useVerifyEmail(onSuccess: () => void) {
    const queryClient = useQueryClient();

    return useMutation<
        Awaited<ReturnType<typeof verifyApplicationEmail>>,
        TErrorMessage,
        string
    >({
        mutationFn: verifyApplicationEmail,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["application-draft"] });
            toast.success("Email verified successfully.");
            onSuccess();
        },
        onError: (error) => {
            toast.error(error.response?.data.message ?? "Invalid verification code.");
        },
    });
}
