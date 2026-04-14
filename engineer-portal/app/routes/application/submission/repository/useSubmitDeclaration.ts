import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types.ts";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {ApplicationResponse} from "~/routes/application/type";
import { submitDeclaration } from "../requests/submit-declaration";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";

export function useSubmitDeclaration(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    const { clearAll } = useApplicationFormStore();
    return useMutation({
        mutationFn: submitDeclaration,
        onSuccess: (data) => {
            clearAll();
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "");
        },
    });
}