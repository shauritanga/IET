import http from "~/utils/http";
import type {ApiCollectionResponse, MembershipFeeHistoryItem} from "../type";

export async function getMembershipFeeHistory() {
    const response = await http.get<ApiCollectionResponse<MembershipFeeHistoryItem>>(
        "/memberships/me/fees?page=1&limit=4",
    );
    return response.data;
}
