import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {PersonalDetailsFormType} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import type {ApplicationResponse} from "~/routes/application/type";
import {getApplicationId} from "~/utils/appplication";

/** Fields accepted by PATCH /steps/personal-details (email is account-owned and not updatable here). */
function toUpdatePersonalDetailsPayload(data: PersonalDetailsFormType) {
    const {
        email: _email,
        profilePhotoUrl: _profilePhotoUrl,
        ...payload
    } = data;

    return {
        title: payload.title || undefined,
        firstName: payload.firstName,
        middleName: payload.middleName || undefined,
        lastName: payload.lastName,
        gender: payload.gender,
        nationality: payload.nationality,
        dateOfBirth: payload.dateOfBirth,
        phoneNumber: payload.phoneNumber,
        employer: payload.employer || undefined,
        position: payload.position || undefined,
    };
}

export async function submitPersonalDetails(data: PersonalDetailsFormType) {
    const applicationId = getApplicationId();
    const response = applicationId
        ? await http.patch<APIResponse<ApplicationResponse>>(
            `/registrations/${applicationId}/steps/personal-details`,
            toUpdatePersonalDetailsPayload(data),
        )
        : await http.post<APIResponse<ApplicationResponse>>(
            "/registrations",
            data,
        );
    return response.data;
}
