import {zodResolver} from "@hookform/resolvers/zod";
import {useForm, useWatch} from "react-hook-form";
import z from "zod";
import {useEffect} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


export const ProposerSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    membershipCategory: z.string().min(1, "Membership category is required"),
    membershipNumber: z.string().min(1, "Membership number is required"),
});

export const SupporterSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    membershipCategory: z.string().min(1, "Membership category is required"),
    membershipNumber: z.string().min(1, "Membership number is required"),
});

export const ReferenceDetailsFormSchema = z.object({
    proposer: ProposerSchema,
    supporter: SupporterSchema,
});

export type ReferenceDetailsFormType = z.infer<typeof ReferenceDetailsFormSchema>;

export const useManageReferenceDetailsForm = () => {
    const { references, setReferences, _hasHydrated } = useApplicationFormStore();
    const { data: draft } = useGetApplicationDraft();

    const form = useForm<ReferenceDetailsFormType>({
        resolver: zodResolver(ReferenceDetailsFormSchema),
        defaultValues: {
            proposer: { fullName: "", membershipCategory: "", membershipNumber: "" },
            supporter: { fullName: "", membershipCategory: "", membershipNumber: "" },
        },
    });

    useEffect(() => {
        if (_hasHydrated && Object.keys(references).length > 0) {
            form.reset(references as Partial<ReferenceDetailsFormType>);
        }
    }, [_hasHydrated]);

    useEffect(() => {
        const registrationReferences = draft?.data?.registration?.references;
        if (!registrationReferences?.length) return;

        const proposer = registrationReferences.find((ref) => ref.referenceType === "PROPOSER");
        const supporter = registrationReferences.find((ref) => ref.referenceType === "SUPPORTER");

        form.reset({
            proposer: {
                fullName: proposer?.fullName ?? "",
                membershipCategory: proposer?.membershipCategory ?? "",
                membershipNumber: proposer?.membershipNumber ?? "",
            },
            supporter: {
                fullName: supporter?.fullName ?? "",
                membershipCategory: supporter?.membershipCategory ?? "",
                membershipNumber: supporter?.membershipNumber ?? "",
            },
        });
    }, [draft, form]);

    const watched = useWatch({ control: form.control });
    useEffect(() => {
        if (!_hasHydrated) return;
        setReferences(watched);
    }, [watched, _hasHydrated]);

    return form;
};
