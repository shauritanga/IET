import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type { UserProfile } from "../type";


export async function getUserProfile() {
    const response = await http.get<APIResponse<UserProfile>>(
        `/users/profile`
    );
    return response.data;
}