import {z} from "zod";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useState} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


export const InstitutionSchema = z.object({
    institutionName: z.string(),
    registrationDate: z.string(),
    classRegistered: z.string()
});

export const RegistrationDetailsFormSchema = z.object({
    engineeringDiscipline: z.string({message: "Engineering Discipline is required"}),
    appliedMembershipType: z.string({message: "Membership type is required"}),
    registeredWithStatutoryBoard: z.boolean(),
    memberOfOtherInstitutions: z.boolean(),
    supportingDocument: z.url().optional(),
    institutions: z.array(InstitutionSchema).optional()
});

export type RegistrationDetailsFormType = z.infer<typeof RegistrationDetailsFormSchema>;

const defaultInstitution = {
    institutionName: "",
    registrationDate: "",
    classRegistered: ""
};

export const useManageRegistrationDetailsForm = () => {
    const { data: draft, isLoading } = useGetApplicationDraft();

    const [savedInstitutionCount, setSavedInstitutionCount] = useState(0);

    const form = useForm<RegistrationDetailsFormType>({
        resolver: zodResolver(RegistrationDetailsFormSchema),
        defaultValues: {
            institutions: [{ ...defaultInstitution }],
            registeredWithStatutoryBoard: false,
            memberOfOtherInstitutions: false,
        },
    });

    const institutionsFieldArray = useFieldArray({ control: form.control, name: "institutions" });


    const saveAndAddInstitution = async () => {
        const isValid = await form.trigger([
            `institutions.${savedInstitutionCount}.institutionName`,
            `institutions.${savedInstitutionCount}.registrationDate`,
            `institutions.${savedInstitutionCount}.classRegistered`,
        ]);
        if (!isValid) return;
        setSavedInstitutionCount(prev => prev + 1);
        institutionsFieldArray.append({ ...defaultInstitution });
    };

    const removeInstitution = (index: number) => {
        institutionsFieldArray.remove(index);
        setSavedInstitutionCount(prev => Math.max(0, prev - 1));
    };

    useEffect(() => {
        const details = draft?.data?.registration?.registrationDetails;
        if (!details) return;

        const institutions = details.institutions?.length
            ? details.institutions.map(inst => ({
                institutionName: inst.institutionName ?? "",
                registrationDate: inst.registrationDate ?? "",
                classRegistered: inst.classRegistered ?? "",
            }))
            : [{ ...defaultInstitution }];

        // Set saved count to match how many institutions came from backend
        const savedCount = details.institutions?.length ?? 0;
        setSavedInstitutionCount(savedCount);

        form.reset({
            // Map backend field names → form field names
            engineeringDiscipline: details.engineeringDiscipline ?? "",
            appliedMembershipType: details.appliedMembershipClass ?? details.registrationCategory ?? "",
            registeredWithStatutoryBoard: details.registeredWithStatutoryBoards ?? false,
            memberOfOtherInstitutions: details.memberOfOtherInstitutions ?? false,
            supportingDocument: details.supportingDocument ?? undefined,
            institutions: [
                ...institutions,
                { ...defaultInstitution }, // always keep one blank active form at the end
            ],
        });
    }, [draft]);

    return {
        form,
        isLoading,
        institutionsFieldArray,
        savedInstitutionCount,
        saveAndAddInstitution,
        removeInstitution
    };
};