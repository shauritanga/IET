import {FormProvider} from 'react-hook-form';
import {Link, useNavigate} from "react-router";
import {Button} from "~/components/ui/button";
import ExperienceDetailsForm from "~/routes/application/experience/form/experience-details-form";
import {useManageExperienceForm, type ExperienceDetailsFormType} from "./form/manage-experience-details-form";
import { useSubmitExperienceDetails } from './repository/useSubmitExperienceDetails';
import {Spinner} from "~/components/ui/spinner";

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

    const mutation = useSubmitExperienceDetails(() =>
        navigate("/application/references", {replace: true})
    );

    const submit = (value: ExperienceDetailsFormType) => {
        const payload = {
            ...value,
            education: value.education?.slice(0, savedEducationCount),
            workExperience: value.workExperience?.slice(0, savedWorkCount),
        };
        mutation.mutate(payload);
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(submit)}
                className="flex flex-col justify-between w-full h-full max-w-2xl space-y-4"
            >
                <div>
                    <h2 className="text-xl font-semibold">Education & Professional Details</h2>
                    <p className="text-sm font-light text-[#7A7773]">Complete your education background</p>
                </div>
                <div className="overflow-y-scroll pt-4 md:pt-10 flex-1 px-1  no-scrollbar">
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
                </div>
                <div className="w-full flex items-center justify-between mt-8 lg:mt-0">
                    <Link to="/application/registration-details">
                        <Button size="lg">Back</Button>
                    </Link>
                    <div className="hidden lg:block"/>
                    <Button type="submit" size="lg" disabled={mutation.isPending}>
                        {mutation.isPending ? <Spinner/> : "Continue"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

export default Experience;