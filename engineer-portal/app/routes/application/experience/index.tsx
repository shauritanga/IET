import {FormProvider} from 'react-hook-form';
import {useNavigate} from "react-router";
import ExperienceDetailsForm from "~/routes/application/experience/form/experience-details-form";
import {useManageExperienceForm, type ExperienceDetailsFormType} from "./form/manage-experience-details-form";
import { useSubmitExperienceDetails } from './repository/useSubmitExperienceDetails';
import FormPageLayout from "~/routes/application/components/form-page-layout";
import { mapServerErrors } from "~/utils/map-server-errors";

const Experience = () => {
    const navigate = useNavigate();
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
        () => navigate("/application/references", { replace: true }),
        (error) => mapServerErrors(error, form),
    );

    const submit = (value: ExperienceDetailsFormType) => {
        const payload = {
            ...value,
            education: value.education?.slice(0, savedEducationCount).map((item) => ({
                ...item,
                institutionId: item.institutionId === "OTHER" ? undefined : item.institutionId || undefined,
            })),
            workExperience: value.workExperience?.slice(0, savedWorkCount),
        };
        mutation.mutate(payload);
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
