import {zodResolver} from "@hookform/resolvers/zod";
import {useForm, useWatch} from "react-hook-form";
import z from "zod";
import {useEffect} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


const RefereeSchema = z.object({
    fullName: z.string().min(1, "Please search and select a member"),
    membershipCategory: z.string().min(1, "Please search and select a member"),
    membershipNumber: z.string().min(1, "Please search and select a member"),
    organisation: z.string().optional().default(""),
    email: z.string().optional().default(""),
    phoneNumber: z.string().optional().default(""),
    relationship: z.string().min(1, "Relationship is required"),
});

export const ProposerSchema = RefereeSchema;
export const SupporterSchema = RefereeSchema;

export const ReferenceDetailsFormSchema = z
    .object({
        proposer: ProposerSchema,
        supporter: SupporterSchema,
    })
    .refine(
        (data) =>
            !data.proposer.membershipNumber ||
            !data.supporter.membershipNumber ||
            data.proposer.membershipNumber !== data.supporter.membershipNumber,
        {
            message: "Proposer and supporter must be different members",
            path: ["supporter", "membershipNumber"],
        },
    );

export type ReferenceDetailsFormType = z.infer<typeof ReferenceDetailsFormSchema>;

export const useManageReferenceDetailsForm = () => {
    const { references, setReferences, _hasHydrated } = useApplicationFormStore();
    const { data: draft } = useGetApplicationDraft();

    const emptyReferee = { fullName: "", membershipCategory: "", membershipNumber: "", organisation: "", email: "", phoneNumber: "", relationship: "" };

    const form = useForm<ReferenceDetailsFormType>({
        resolver: zodResolver(ReferenceDetailsFormSchema),
        defaultValues: {
            proposer: { ...emptyReferee },
            supporter: { ...emptyReferee },
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
                organisation: (proposer as any)?.organisation ?? "",
                email: (proposer as any)?.email ?? "",
                phoneNumber: (proposer as any)?.phoneNumber ?? "",
                relationship: (proposer as any)?.relationship ?? "",
            },
            supporter: {
                fullName: supporter?.fullName ?? "",
                membershipCategory: supporter?.membershipCategory ?? "",
                membershipNumber: supporter?.membershipNumber ?? "",
                organisation: (supporter as any)?.organisation ?? "",
                email: (supporter as any)?.email ?? "",
                phoneNumber: (supporter as any)?.phoneNumber ?? "",
                relationship: (supporter as any)?.relationship ?? "",
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
