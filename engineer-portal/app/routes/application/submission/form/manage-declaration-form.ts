import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

export const DeclarationFormSchema = z.object({
    declarationDate: z.string().min(1, "Declaration date is required"),
    declarationAgreed: z.literal(true, {
        error: () => ({ message: "You must agree to the declaration before submitting." }),
    }),
});

export type DeclarationFormType = z.infer<typeof DeclarationFormSchema>

export const useManageDeclarationForm = () => {
    return useForm<DeclarationFormType>({
        resolver: zodResolver(DeclarationFormSchema),
    });
}
