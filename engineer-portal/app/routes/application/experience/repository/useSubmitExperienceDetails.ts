// use-submit-experience-details.ts
import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";
import type {APIResponse, TErrorMessage, TSuccess} from "~/types/types";
import type {ApplicationResponse} from "~/routes/application/type";
import type {ExperienceDetailsFormType} from "../form/manage-experience-details-form";
import { submitExperienceDetails } from "../requests/submit-experience";

export function useSubmitExperienceDetails(onSuccess: TSuccess<APIResponse<ApplicationResponse>>) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ExperienceDetailsFormType) => submitExperienceDetails(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["application-draft"] });
            toast.success("Submitted Successfully!");
            onSuccess(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Something went wrong");
        },
    });
}
