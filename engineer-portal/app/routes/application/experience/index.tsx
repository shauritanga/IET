import {FormProvider} from 'react-hook-form';
import {useNavigate} from "react-router";
import toast from "react-hot-toast";
import ExperienceDetailsForm from "~/routes/application/experience/form/experience-details-form";
import {
    useManageExperienceForm,
    type ExperienceDetailsFormType,
    isEducationEntryFilled,
    isWorkExperienceEntryFilled,
} from "./form/manage-experience-details-form";
import { useSubmitExperienceDetails } from './repository/useSubmitExperienceDetails';
import FormPageLayout from "~/routes/application/components/form-page-layout";
import { mapServerErrors } from "~/utils/map-server-errors";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import {
    getRouteAfterSavingStep,
    getSubmitLabel,
} from "~/routes/application/utils/application-steps";

function collectEducationPayload(
    value: ExperienceDetailsFormType,
    savedEducationCount: number,
) {
    const rows = value.education ?? [];
    const committed = rows.slice(0, savedEducationCount);
    const active = rows[savedEducationCount];
    const combined = isEducationEntryFilled(active)
        ? [...committed, active]
        : committed;

    return combined.map((item) => ({
        ...item,
        institutionId:
            item.institutionId === "OTHER"
                ? undefined
                : item.institutionId || undefined,
    }));
}

function collectWorkExperiencePayload(
    value: ExperienceDetailsFormType,
    savedWorkCount: number,
) {
    const rows = value.workExperience ?? [];
    const committed = rows.slice(0, savedWorkCount);
    const active = rows[savedWorkCount];
    return isWorkExperienceEntryFilled(active)
        ? [...committed, active]
        : committed;
}

const Experience = () => {
    const navigate = useNavigate();
    const { data: draft } = useGetApplicationDraft();
    const completedSteps = draft?.data?.completedSteps ?? [];
    const {
        form,
        educationFieldArray,
        workExperienceFieldArray,
        savedEducationCount,
        savedWorkCount,
        saveAndAddEducation,
        removeEducation,
        saveAndAddWorkExperience,
        removeWorkExperience,
    } = useManageExperienceForm();

    const mutation = useSubmitExperienceDetails(
        () =>
            navigate(
                getRouteAfterSavingStep(
                    completedSteps,
                    "EDUCATION_EXPERIENCE",
                    "/application/references",
                ),
                { replace: true },
            ),
        (error) => mapServerErrors(error, form),
    );

    const submit = (value: ExperienceDetailsFormType) => {
        const education = collectEducationPayload(value, savedEducationCount);
        const workExperience = collectWorkExperiencePayload(value, savedWorkCount);

        if (education.length === 0) {
            toast.error("Add at least one education record before continuing.");
            return;
        }

        mutation.mutate({
            ...value,
            education,
            workExperience,
        });
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(submit)}
                className="w-full"
            >
                <FormPageLayout
                    stepNumber={3}
                    title="Education & Professional Details"
                    subtitle="Complete your educational and professional background."
                    backHref="/application/registration-details"
                    isPending={mutation.isPending}
                    submitLabel={getSubmitLabel(completedSteps, "EDUCATION_EXPERIENCE")}
                >
                    <ExperienceDetailsForm
                        educationFieldArray={educationFieldArray}
                        workExperienceFieldArray={workExperienceFieldArray}
                        savedEducationCount={savedEducationCount}
                        savedWorkCount={savedWorkCount}
                        saveAndAddEducation={saveAndAddEducation}
                        removeEducation={removeEducation}
                        saveAndAddWorkExperience={saveAndAddWorkExperience}
                        removeWorkExperience={removeWorkExperience}
                    />
                </FormPageLayout>
            </form>
        </FormProvider>
    );
};

export default Experience;
