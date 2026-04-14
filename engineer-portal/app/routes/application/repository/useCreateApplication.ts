import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types";
import type {ApplicationResponse} from "~/routes/application/type";
import {useMutation} from "@tanstack/react-query";
import {createApplication} from "~/routes/application/requests/handle-create-application";
import {setToCookie} from "~/utils/storage";
import toast from "react-hot-toast";

export function useCreateApplication(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    return useMutation({
        mutationFn: createApplication,
        onSuccess: (data) => {
            // Store applicationId for use in subsequent steps
            setToCookie("application-id", data.data.applicationId);
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "");
        },
    });
}
