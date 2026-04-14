import {useQuery} from "@tanstack/react-query";
import type {APIResponse, TErrorMessage} from "~/types/types";
import type {UserProfile} from "../type";
import {getUserProfile} from "../requests/get-user-profile";

export function useGetUserProfile() {
    return useQuery<APIResponse<UserProfile>, TErrorMessage>({
        queryKey: ["user-profile"],
        queryFn: getUserProfile,
    });
}