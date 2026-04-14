import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types.ts";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import {submitPersonalDetails} from "~/routes/application/personal-details/requests/submit-personal-details";
import type {ApplicationResponse} from "~/routes/application/type";
import {setToCookie} from "~/utils/storage";

type SubmitPersonalDetailsOptions = {
    onSuccess: TSuccess<APIResponse<ApplicationResponse>>;
    onValidationError?: (error: TErrorMessage) => void;
};

export function useSubmitPersonalDetails({
    onSuccess,
    onValidationError,
}: SubmitPersonalDetailsOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitPersonalDetails,
        onSuccess: (data) => {
            setToCookie("application-id", data.data.applicationId);
            queryClient.invalidateQueries({ queryKey: ["application-draft"] });
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            if (error.response?.data.errors?.length) {
                onValidationError?.(error);
                toast.error("Please fix the highlighted fields and try again.");
                return;
            }

            toast.error(error.response?.data.message ?? "");
        },
    });
}
