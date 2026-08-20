import {FormProvider} from 'react-hook-form';
import {useNavigate} from "react-router";
import toast from "react-hot-toast";
import type {FormEvent} from "react";
import ExperienceDetailsForm from "~/routes/application/experience/form/experience-details-form";
import {
    useManageExperienceForm,
    type ExperienceDetailsFormType,
    isEducationEntryFilled,
    isEducationEntryStarted,
    isWorkExperienceEntryFilled,
    isWorkExperienceEntryStarted,
    educationActiveFieldPaths,
    workExperienceActiveFieldPaths,
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
        attachment: item.attachment || undefined,
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

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const value = form.getValues();
        const activeEducation = value.education?.[savedEducationCount];
        const activeWork = value.workExperience?.[savedWorkCount];

        // Education is always required: validate the on-screen form when it is
        // the only/first entry, or when the user has started filling another one.
        const mustValidateEducation =
            savedEducationCount === 0 || isEducationEntryStarted(activeEducation);

        if (mustValidateEducation) {
            const educationValid = await form.trigger(
                [...educationActiveFieldPaths(savedEducationCount)],
                { shouldFocus: true },
            );
            if (!educationValid) {
                toast.error("Please complete your education details before continuing.");
                return;
            }
        }

        // Work experience is optional, but if started it must be complete.
        if (isWorkExperienceEntryStarted(activeWork)) {
            const workValid = await form.trigger(
                [...workExperienceActiveFieldPaths(savedWorkCount)],
                { shouldFocus: true },
            );
            if (!workValid) {
                toast.error("Please complete the work experience fields, or clear them.");
                return;
            }
        }

        const education = collectEducationPayload(value, savedEducationCount);
        const workExperience = collectWorkExperiencePayload(value, savedWorkCount);

        if (education.length === 0) {
            await form.trigger(
                [...educationActiveFieldPaths(savedEducationCount)],
                { shouldFocus: true },
            );
            toast.error("At least one education record is required.");
            return;
        }

        mutation.mutate({
            ...value,
            education,
            workExperience,
            cvAttachment: value.cvAttachment || undefined,
        });
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={submit}
                className="w-full"
                noValidate
            >
                <FormPageLayout
                    stepNumber={3}
                    title="Education & Professional Details"
                    subtitle="Enter your education below, then click Save & Continue. Use “Add another” only if you have more than one institution or job."
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
