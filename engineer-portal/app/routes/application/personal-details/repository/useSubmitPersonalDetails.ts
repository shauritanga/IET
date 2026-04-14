import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types.ts";
import {useMutation} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {submitPersonalDetails} from "~/routes/application/personal-details/requests/submit-personal-details";
import type {ApplicationResponse} from "~/routes/application/type";
import {setToCookie} from "~/utils/storage";

export function useSubmitPersonalDetails(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    return useMutation({
        mutationFn: submitPersonalDetails,
        onSuccess: (data) => {
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "");
        },
    });
}