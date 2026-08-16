// references.tsx (page)
import {useNavigate} from "react-router";
import ReferenceForm from "./forms/reference-form";
import {FormProvider} from "react-hook-form";
import {
    useManageReferenceDetailsForm,
    type ReferenceDetailsFormType
} from "./forms/manage-reference-forms";
import { useSubmitReferenceDetails } from "./repository/useSubmitReferenceDetails";
import FormPageLayout from "~/routes/application/components/form-page-layout";
import { mapServerErrors } from "~/utils/map-server-errors";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import {
    getRouteAfterSavingStep,
    getSubmitLabel,
} from "~/routes/application/utils/application-steps";

const References = () => {
    const navigate = useNavigate();
    const form = useManageReferenceDetailsForm();
    const { data: draft } = useGetApplicationDraft();
    const completedSteps = draft?.data?.completedSteps ?? [];

    const mutation = useSubmitReferenceDetails(
        () =>
            navigate(
                getRouteAfterSavingStep(
                    completedSteps,
                    "REFERENCES",
                    "/application/review",
                ),
                { replace: true },
            ),
        (error) => mapServerErrors(error, form),
    );

    const submit = (value: ReferenceDetailsFormType) => {
        mutation.mutate(value);
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(submit)}
                className="w-full"
            >
                <FormPageLayout
                    stepNumber={4}
                    title="References"
                    subtitle="Search and select your proposer and supporter."
                    backHref="/application/experience"
                    isPending={mutation.isPending}
                    submitLabel={getSubmitLabel(completedSteps, "REFERENCES")}
                >
                    <ReferenceForm/>
                </FormPageLayout>
            </form>
        </FormProvider>
    );
};

export default References;
