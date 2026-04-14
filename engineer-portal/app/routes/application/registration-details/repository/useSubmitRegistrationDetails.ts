import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {ApplicationResponse} from "~/routes/application/type";
import { submitRegistrationDetails } from "../requests/submit-registration-details";

export function useSubmitRegistrationDetails(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitRegistrationDetails,
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
