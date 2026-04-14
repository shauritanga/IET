import z from "zod";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


export const EducationDetailSchema = z.object({
    institutionName: z.string(),
    country: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    courseName: z.string(),
    attachment: z.url().optional(),
});

export const WorkExperienceSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    position: z.string(),
    employer: z.string(),
});

export const ExperienceDetailsFormSchema = z.object({
    education: z.array(EducationDetailSchema),
    workExperience: z.array(WorkExperienceSchema),
    cvAttachment: z.url().optional()
});

export type ExperienceDetailsFormType = z.infer<typeof ExperienceDetailsFormSchema>;

const defaultEducation = {
    institutionName: "",
    country: "",
    startDate: "",
    endDate: "",
    courseName: "",
    attachment: undefined,
};

const defaultWorkExperience = {
    startDate: "",
    endDate: "",
    position: "",
    employer: "",
};

export const useManageExperienceForm = () => {
    const {
        experience, setExperience,
        savedEducationCount, savedWorkCount,
        setSavedEducationCount, setSavedWorkCount,
        _hasHydrated,
    } = useApplicationFormStore();
    const { data: draft } = useGetApplicationDraft();

    const form = useForm<ExperienceDetailsFormType>({
        resolver: zodResolver(ExperienceDetailsFormSchema),
        defaultValues: {
            education: [{ ...defaultEducation }],
            workExperience: [{ ...defaultWorkExperience }],
            cvAttachment: undefined,
        },
    });

    const educationFieldArray = useFieldArray({ control: form.control, name: "education" });
    const workExperienceFieldArray = useFieldArray({ control: form.control, name: "workExperience" });

    useEffect(() => {
        if (_hasHydrated && Object.keys(experience).length > 0) {
            form.reset(experience as Partial<ExperienceDetailsFormType>);
        }
    }, [_hasHydrated]);

    useEffect(() => {
        const registration = draft?.data?.registration;
        if (!registration) return;

        const education = registration.educations?.length
            ? registration.educations.map((item) => ({
                institutionName: item.institutionName ?? "",
                country: item.fieldOfStudy ?? "",
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
                courseName: item.qualification ?? "",
                attachment: undefined,
            }))
            : [{ ...defaultEducation }];

        const workExperience = registration.experiences?.length
            ? registration.experiences.map((item) => ({
                employer: item.employerName ?? "",
                position: item.position ?? "",
                startDate: item.startDate ?? "",
                endDate: item.endDate ?? "",
            }))
            : [{ ...defaultWorkExperience }];

        setSavedEducationCount(registration.educations?.length ?? 0);
        setSavedWorkCount(registration.experiences?.length ?? 0);

        form.reset({
            education: [
                ...education,
                { ...defaultEducation },
            ],
            workExperience: [
                ...workExperience,
                { ...defaultWorkExperience },
            ],
            cvAttachment: undefined,
        });
    }, [draft, form, setSavedEducationCount, setSavedWorkCount]);

    const watched = useWatch({ control: form.control });
    useEffect(() => {
        if (!_hasHydrated) return;
        setExperience(watched);
    }, [watched, _hasHydrated]);

    const saveAndAddEducation = async () => {
        const isValid = await form.trigger([
            `education.${savedEducationCount}.institutionName`,
            `education.${savedEducationCount}.country`,
            `education.${savedEducationCount}.startDate`,
            `education.${savedEducationCount}.endDate`,
            `education.${savedEducationCount}.courseName`,
        ]);
        if (!isValid) return;
        setSavedEducationCount(savedEducationCount + 1);
        educationFieldArray.append({ ...defaultEducation });
    };

    const removeEducation = (index: number) => {
        educationFieldArray.remove(index);
        setSavedEducationCount(Math.max(0, savedEducationCount - 1));
    };

    const saveAndAddWorkExperience = async () => {
        const isValid = await form.trigger([
            `workExperience.${savedWorkCount}.employer`,
            `workExperience.${savedWorkCount}.position`,
            `workExperience.${savedWorkCount}.startDate`,
            `workExperience.${savedWorkCount}.endDate`,
        ]);
        if (!isValid) return;
        setSavedWorkCount(savedWorkCount + 1);
        workExperienceFieldArray.append({ ...defaultWorkExperience });
    };

    const removeWorkExperience = (index: number) => {
        workExperienceFieldArray.remove(index);
        setSavedWorkCount(Math.max(0, savedWorkCount - 1));
    };

    return {
        form,
        educationFieldArray,
        workExperienceFieldArray,
        savedEducationCount,
        savedWorkCount,
        saveAndAddEducation,
        removeEducation,
        saveAndAddWorkExperience,
        removeWorkExperience,
    };
};
