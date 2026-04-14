import {z} from "zod";
import {useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useRef} from "react";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";
import {useGetUserProfile} from "~/routes/dashboard/profile/repositories/handle-get-user-profile";


export const PersonalDetailsFormSchema = z.object({
    title: z.string().optional(),
    firstName: z.string({message: "First name is required"}),
    middleName: z.string().optional(),
    lastName: z.string({message: "Last name is required"}),
    gender: z.enum(["MALE", "FEMALE"]),
    nationality: z.string({message: "Nationality is required"}),
    dateOfBirth: z.string({message: "Date of birth is required"}),
    phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, {
        message: "Phone number must be in international format, e.g. +255657000000",
    }),
    email: z.string().email({message: "Email is required"}),
    employer: z.string().optional(),
    position: z.string().optional(),
    profilePhotoUrl: z.url().optional(),
});

export type PersonalDetailsFormType = z.infer<typeof PersonalDetailsFormSchema>;

export const useManagePersonalDetailsForm = () => {
    const { data: draft } = useGetApplicationDraft();
    const { data: profile } = useGetUserProfile();
    const hydratedFromProfileRef = useRef(false);
    const hydratedFromDraftRef = useRef(false);

    const form = useForm<PersonalDetailsFormType>({
        resolver: zodResolver(PersonalDetailsFormSchema),
        defaultValues: {
            title: "",
            firstName: "",
            middleName: "",
            lastName: "",
            nationality: "",
            dateOfBirth: "",
            phoneNumber: "",
            email: "",
            employer: "",
            position: "",
            profilePhotoUrl: undefined,
        },
    });

    useEffect(() => {
        const personalDetails = draft?.data?.registration?.personalDetails;
        if (!personalDetails || hydratedFromDraftRef.current) {
            return;
        }

        hydratedFromDraftRef.current = true;
        form.reset(
            {
                title: personalDetails.title ?? "",
                firstName: personalDetails.firstName ?? "",
                middleName: personalDetails.middleName ?? "",
                lastName: personalDetails.lastName ?? "",
                gender: personalDetails.gender,
                nationality: personalDetails.nationality ?? "",
                dateOfBirth: personalDetails.dateOfBirth ?? "",
                phoneNumber: personalDetails.phoneNumber ?? "",
                email: personalDetails.email ?? "",
                employer: personalDetails.employer ?? "",
                position: personalDetails.position ?? "",
                profilePhotoUrl: personalDetails.profilePhotoUrl ?? undefined,
            },
            { keepDirtyValues: true },
        );
    }, [draft, form]);

    useEffect(() => {
        const profileData = profile?.data;
        if (!profileData || draft?.data?.registration?.personalDetails || hydratedFromProfileRef.current) {
            return;
        }

        hydratedFromProfileRef.current = true;
        form.reset(
            {
                title: profileData.title ?? "",
                firstName: profileData.firstName ?? "",
                middleName: profileData.middleName ?? "",
                lastName: profileData.lastName ?? "",
                gender: profileData.gender,
                nationality: profileData.nationality ?? "",
                dateOfBirth: profileData.dateOfBirth ?? "",
                phoneNumber: profileData.phoneNumber ?? "",
                email: profileData.email ?? "",
                employer: profileData.employer ?? "",
                position: profileData.position ?? "",
                profilePhotoUrl: profileData.profilePhotoUrl ?? undefined,
            },
            { keepDirtyValues: true },
        );
    }, [draft, form, profile]);

    return {form}
};
