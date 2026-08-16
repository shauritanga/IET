// registration-details.tsx (page)
import {useNavigate} from "react-router";
import RegistrationDetailsForm from "~/routes/application/registration-details/form/registration-details-form";
import {FormProvider} from 'react-hook-form';
import {
    useManageRegistrationDetailsForm,
    type RegistrationDetailsFormType
} from './form/manage-registration-details-form';
import {useSubmitRegistrationDetails} from "./repository/useSubmitRegistrationDetails";
import FormPageLayout from "~/routes/application/components/form-page-layout";
import { mapServerErrors } from "~/utils/map-server-errors";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import {
    getRouteAfterSavingStep,
    getSubmitLabel,
} from "~/routes/application/utils/application-steps";

const RegistrationDetails = () => {
    const navigate = useNavigate();
    const { data: draft } = useGetApplicationDraft();
    const completedSteps = draft?.data?.completedSteps ?? [];
    const {
        form: formOptions,
        institutionsFieldArray,
        saveAndAddInstitution,
        savedInstitutionCount,
        removeInstitution
    } = useManageRegistrationDetailsForm();

    const mutation = useSubmitRegistrationDetails(
        () =>
            navigate(
                getRouteAfterSavingStep(
                    completedSteps,
                    "REGISTRATION_DETAILS",
                    "/application/experience",
                ),
                { replace: true },
            ),
        (error) => mapServerErrors(error, formOptions),
    );

    const submit = (value: RegistrationDetailsFormType) => {
        const payload = {
            ...value,
            institutions: value.institutions?.slice(0, savedInstitutionCount),
        };
        mutation.mutate(payload);
    };

    return (
        <FormProvider {...formOptions}>
            <form
                onSubmit={formOptions.handleSubmit(submit)}
                className="w-full"
            >
                <FormPageLayout
                    stepNumber={2}
                    title="Registration Details"
                    subtitle="Provide your identification and professional registration details."
                    backHref="/application/personal-details"
                    isPending={mutation.isPending}
                    submitLabel={getSubmitLabel(completedSteps, "REGISTRATION_DETAILS")}
                >
                    <RegistrationDetailsForm
                        institutionsFieldArray={institutionsFieldArray}
                        savedInstitutionCount={savedInstitutionCount}
                        saveAndAddInstitution={saveAndAddInstitution}
                        removeInstitution={removeInstitution}
                    />
                </FormPageLayout>
            </form>
        </FormProvider>
    );
};

export default RegistrationDetails;
