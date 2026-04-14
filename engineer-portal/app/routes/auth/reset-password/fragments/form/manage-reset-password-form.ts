import {z} from "zod";
import {useForm} from "react-hook-form";

export const ResetPasswordFormSchema = z.object({
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, "Password must contain both letters and numbers"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type ResetPasswordFormType = z.infer<typeof ResetPasswordFormSchema>;

export const useManageResetPasswordForm = () => {
    const {register, formState: {errors}, handleSubmit, getValues} = useForm<ResetPasswordFormType>()

    return {
        register,
        formState: {errors},
        getValues,
        handleSubmit
    }
}