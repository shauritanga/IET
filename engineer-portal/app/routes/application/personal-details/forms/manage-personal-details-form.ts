import {z} from "zod";
import {useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


export const PersonalDetailsFormSchema = z.object({
    title: z.string({message: "Title is required"}),
    firstName: z.string({message: "First name is required"}),
    middleName: z.string({message: "Middle name is required"}),
    lastName: z.string({message: "Last name is required"}),
    gender: z.enum(["MALE", "FEMALE"]),
    nationality: z.string({message: "Nationality is required"}),
    dateOfBirth: z.string({message: "Date of birth is required"}),
    phoneNumber: z.string({message: "Phone number is required"}),
    email: z.email({message: "Email is required"}),
    employer: z.string({message: "Employer is required"}),
    position: z.string({message: "Position is required"}),
    profilePhotoUrl: z.url().optional(),
});

export type PersonalDetailsFormType = z.infer<typeof PersonalDetailsFormSchema>;

export const useManagePersonalDetailsForm = () => {
    const { data: draft } = useGetApplicationDraft();

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
        if (draft?.data?.registration?.personalDetails) {
            form.reset(draft.data.registration.personalDetails);
        }
    }, [draft]);

    return {form}
};