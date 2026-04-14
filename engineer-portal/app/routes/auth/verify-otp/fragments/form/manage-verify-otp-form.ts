import {z} from "zod";
import {useForm} from "react-hook-form";
import {Controller} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

export const VerifyOtpFormSchema = z.object({
    code: z.string().min(6),
    email:z.email().optional()
});

export type VerifyOtpFormType = z.infer<typeof VerifyOtpFormSchema>;

export const ResendOtpFormSchema = z.object({
    email:z.email()
});

export type ResendOtpFormType = z.infer<typeof ResendOtpFormSchema>;

export const useManageVerifyOtpForm = () => {
    const { register, control, formState: { errors }, handleSubmit, setValue } = useForm<VerifyOtpFormType>({
        resolver: zodResolver(VerifyOtpFormSchema),
    });

    return {
        Controller,
        control,
        register,
        formState: errors,
        handleSubmit,
        setValue
    }
}