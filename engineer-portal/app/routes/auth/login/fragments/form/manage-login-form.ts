import {z} from "zod";
import {useForm} from "react-hook-form";

export const LoginFormSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export type LoginFormType = z.infer<typeof LoginFormSchema>;

export const useManageLoginForm = () => {
    const {register, formState: { errors }, handleSubmit} = useForm<LoginFormType>()

    return {
        register,
        formState: errors,
        handleSubmit
    }
}