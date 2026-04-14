import { useQuery } from "@tanstack/react-query";
import type { APIResponse, TErrorMessage } from "~/types/types";
import type { ApplicationPaymentStatus } from "~/routes/application/type";
import { getApplicationId } from "~/utils/appplication";
import { getApplicationPaymentStatus } from "../requests/get-application-payment-status";

export function useApplicationPaymentStatus() {
    const applicationId = getApplicationId();

    return useQuery<APIResponse<ApplicationPaymentStatus>, TErrorMessage>({
        queryKey: ["application-payment-status", applicationId],
        queryFn: getApplicationPaymentStatus,
        enabled: !!applicationId,
        refetchOnWindowFocus: false,
        refetchInterval: (query) => {
            const status = query.state.data?.data.paymentStatus;
            return status === "PENDING" || status === "PROCESSING" ? 5000 : false;
        },
    });
}
