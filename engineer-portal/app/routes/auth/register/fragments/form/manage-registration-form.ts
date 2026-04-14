import {z} from "zod";
import {useForm} from "react-hook-form";

export const RegistrationFormSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/, "Password must contain both letters and numbers"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegistrationFormType = z.infer<typeof RegistrationFormSchema>;

export const useManageRegistrationForm = () => {
    const {register, formState: {errors}, handleSubmit, getValues} = useForm<RegistrationFormType>()

    return {
        register,
        formState: {errors},
        getValues,
        handleSubmit
    }
}