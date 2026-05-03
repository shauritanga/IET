import type { APIResponse } from "~/types/types"
import http from "~/utils/http"
import type { UserProfile } from "../type"

export type UpdateProfilePayload = {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    location?: string
    employer?: string
    position?: string
    engineeringDiscipline?: string
}

export async function updateUserProfile(payload: UpdateProfilePayload) {
    const response = await http.put<APIResponse<UserProfile>>("/users/profile", payload)
    return response.data
}
