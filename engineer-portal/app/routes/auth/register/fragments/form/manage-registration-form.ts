import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{1,14}$/;

export const normalizePhoneNumber = (value: string) =>
    value.replace(/[\s()-]/g, "").trim();

export const RegistrationFormSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("Please enter a valid email address"),
    phoneNumber: z
        .string()
        .trim()
        .min(1, "Phone number is required")
        .refine(
            (value) => {
                const normalizedValue = normalizePhoneNumber(value);
                return PHONE_NUMBER_PATTERN.test(normalizedValue);
            },
            "Phone number must be in international format (e.g. +255657000000)"
        ),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(50, "Password cannot exceed 50 characters")
        .regex(/^\S+$/, "Password cannot contain spaces")
        .regex(/[a-z]/, "Add a lowercase letter")
        .regex(/[A-Z]/, "Add an uppercase letter")
        .regex(/\d/, "Add a number")
        .regex(/[^A-Za-z\d\s]/, "Add a special character (e.g. # _ - ! @)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((value) => value, {
        message: "You must accept the terms.",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegistrationFormValues = z.infer<typeof RegistrationFormSchema>;
export type RegistrationFormType = {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
};

export const useManageRegistrationForm = () => {
    const form = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationFormSchema),
        mode: "onTouched",
        defaultValues: {
            firstName: "",
            middleName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            acceptTerms: false,
        },
    });

    return {
        form,
    };
};
