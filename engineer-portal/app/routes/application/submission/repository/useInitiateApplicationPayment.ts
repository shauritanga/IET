import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { APIResponse, TErrorMessage } from "~/types/types";
import type { ApplicationPaymentStatus } from "~/routes/application/type";
import {
    initiateApplicationPayment,
    type InitiateApplicationPaymentPayload,
} from "../requests/initiate-application-payment";

export function useInitiateApplicationPayment() {
    const queryClient = useQueryClient();

    return useMutation<
        APIResponse<ApplicationPaymentStatus>,
        TErrorMessage,
        InitiateApplicationPaymentPayload
    >({
        mutationFn: initiateApplicationPayment,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["application-draft"] });
            queryClient.invalidateQueries({ queryKey: ["application-payment-status"] });
            toast.success(data.data.message || "Payment request started successfully.");
        },
        onError: (error) => {
            toast.error(error.response?.data.message ?? "Unable to start payment.");
        },
    });
}
