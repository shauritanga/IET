import PersonalDetailsForm from "~/routes/application/personal-details/forms/personal-details-form";
import {useNavigate} from "react-router"
import {FormProvider} from "react-hook-form";
import {
    type PersonalDetailsFormType,
    useManagePersonalDetailsForm
} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import {useSubmitPersonalDetails} from "~/routes/application/personal-details/repository/useSubmitPersonalDetails";
import type {TErrorMessage} from "~/types/types";
import FormPageLayout from "~/routes/application/components/form-page-layout";


const PersonalDetails = () => {
    const navigate = useNavigate();
    const {form} = useManagePersonalDetailsForm();

    const handleValidationError = (error: TErrorMessage) => {
        const fieldErrors = error.response?.data.errors ?? [];
        let firstInvalidField: string | null = null;

        fieldErrors.forEach((fieldError) => {
            if (!fieldError.property || !fieldError.message) {
                return;
            }

            if (!firstInvalidField) {
                firstInvalidField = fieldError.property;
            }

            form.setError(fieldError.property as keyof PersonalDetailsFormType, {
                type: "server",
                message: fieldError.message,
            });
        });

        if (!firstInvalidField) {
            return;
        }

        const selector = `[name="${firstInvalidField}"], #${firstInvalidField}`;
        const fieldElement = document.querySelector(selector);
        if (fieldElement instanceof HTMLElement) {
            fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
            fieldElement.focus();
        }
    };

    const {mutate: submitPersonalDetails, isPending} = useSubmitPersonalDetails({
        onSuccess: () => navigate("/application/registration-details", {replace: true}),
        onValidationError: handleValidationError,
    });

    const submit = (value: PersonalDetailsFormType) => {
        form.clearErrors();
        submitPersonalDetails(value);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="w-full">
                <FormPageLayout
                    stepNumber={1}
                    title="Personal Details"
                    subtitle="Provide your personal identification and contact information."
                    isPending={isPending}
                >
                    <PersonalDetailsForm />
                </FormPageLayout>
            </form>
        </FormProvider>
    );
};

export default PersonalDetails;
