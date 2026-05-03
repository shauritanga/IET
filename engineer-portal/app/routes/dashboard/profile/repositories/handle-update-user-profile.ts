import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { updateUserProfile, type UpdateProfilePayload } from "../requests/update-user-profile"

export function useUpdateUserProfile() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => updateUserProfile(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-profile"] })
            toast.success("Profile updated successfully")
        },
        onError: () => {
            toast.error("Failed to update profile. Please try again.")
        },
    })
}
