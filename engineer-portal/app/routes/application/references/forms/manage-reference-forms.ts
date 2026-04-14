import {zodResolver} from "@hookform/resolvers/zod";
import {useForm, useWatch} from "react-hook-form";
import z from "zod";
import {useEffect} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";


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

    const watched = useWatch({ control: form.control });
    useEffect(() => {
        if (!_hasHydrated) return;
        setReferences(watched);
    }, [watched, _hasHydrated]);

    return form;
};