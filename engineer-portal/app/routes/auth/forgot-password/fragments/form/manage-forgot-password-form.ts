import {z} from "zod";
import {useForm} from "react-hook-form";

export const ForgotPasswordFormSchema = z.object({
    email: z.email(),
});

export type ForgotPasswordFormType = z.infer<typeof ForgotPasswordFormSchema>;

export const useManageForgotPasswordForm = () => {
    const {register, formState: {errors}, handleSubmit, getValues} = useForm<ForgotPasswordFormType>()

    return {
        register,
        formState: {errors},
        getValues,
        handleSubmit
    }
}