import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

export const DeclarationFormSchema = z.object({
    declarationDate:z.string(),
    declarationAgreed:z.boolean(),
});

export type DeclarationFormType = z.infer<typeof DeclarationFormSchema>

export const useManageDeclarationForm = () => {
    return useForm<DeclarationFormType>({
        resolver: zodResolver(DeclarationFormSchema),
    });
}