import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {ApplicationResponse} from "~/routes/application/type";
import { submitReferenceDetails } from "../requests/submit-reference";

export function useSubmitReferenceDetails(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitReferenceDetails,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["application-draft"] });
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "");
        },
    });
}
