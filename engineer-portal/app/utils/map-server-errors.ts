import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { TErrorMessage } from "~/types/types";

export function mapServerErrors<T extends FieldValues>(
    error: unknown,
    form: UseFormReturn<T>,
): boolean {
    const errors = (error as TErrorMessage)?.response?.data?.errors;
    if (!Array.isArray(errors) || errors.length === 0) return false;
    errors.forEach(({ property, message }) => {
        if (property && message) {
            form.setError(property as Path<T>, { type: "server", message });
        }
    });
    return true;
}
