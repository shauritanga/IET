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

const RegistrationDetails = () => {
    const navigate = useNavigate();
    const {
        form: formOptions,
        institutionsFieldArray,
        saveAndAddInstitution,
        savedInstitutionCount,
        removeInstitution
    } = useManageRegistrationDetailsForm();

    const mutation = useSubmitRegistrationDetails(() =>
        navigate("/application/experience", {replace: true})
    );

    const submit = (value: RegistrationDetailsFormType) => {
        const payload = {
            ...value,
            institutions: value.institutions?.slice(0, savedInstitutionCount),
        };
        console.log(payload);
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