import {z} from "zod";
import {useForm} from "react-hook-form";

export const RegistrationFormSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            "Password must include uppercase, lowercase, number, and special character"
        ),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
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
