import z from "zod";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useRef} from "react";
import {useApplicationFormStore} from "~/routes/application/store/useApplicationFormStore";
import {useGetApplicationDraft} from "~/routes/application/repository/useResumeApplication";


export const EducationDetailSchema = z.object({
    institutionId: z.string().optional(),
    institutionName: z.string().min(1, "Institution name is required"),
    country: z.string().min(1, "Country is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    courseName: z.string().min(1, "Qualification / course name is required"),
    attachment: z.preprocess(
        (value) => (value === "" || value == null ? undefined : value),
        z.string().url().optional(),
    ),
});

export const WorkExperienceSchema = z.object({
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    position: z.string().min(1, "Position is required"),
    employer: z.string().min(1, "Employer is required"),
});

export const ExperienceDetailsFormSchema = z.object({
    education: z.array(EducationDetailSchema),
    workExperience: z.array(WorkExperienceSchema),
    cvAttachment: z.url().optional()
});

export type ExperienceDetailsFormType = z.infer<typeof ExperienceDetailsFormSchema>;

const defaultEducation = {
    institutionId: "",
    institutionName: "",
    country: "",
    startDate: "",
    endDate: "",
    courseName: "",
    attachment: undefined as string | undefined,
};

const defaultWorkExperience = {
    startDate: "",
    endDate: "",
    position: "",
    employer: "",
};

function toDateInputValue(value?: string | null) {
    if (!value) return "";
    return String(value).slice(0, 10);
}

export function isEducationEntryFilled(
    item?: Partial<ExperienceDetailsFormType["education"][number]> | null,
) {
    if (!item) return false;
    return Boolean(
        item.institutionName?.trim() &&
        item.country?.trim() &&
        item.startDate?.trim() &&
        item.endDate?.trim() &&
        item.courseName?.trim(),
    );
}

export function isEducationEntryStarted(
    item?: Partial<ExperienceDetailsFormType["education"][number]> | null,
) {
    if (!item) return false;
    return Boolean(
        item.institutionId?.trim() ||
        item.institutionName?.trim() ||
        item.country?.trim() ||
        item.startDate?.trim() ||
        item.endDate?.trim() ||
        item.courseName?.trim() ||
        item.attachment,
    );
}

export function isWorkExperienceEntryFilled(
    item?: Partial<ExperienceDetailsFormType["workExperience"][number]> | null,
) {
    if (!item) return false;
    return Boolean(
        item.employer?.trim() &&
        item.position?.trim() &&
        item.startDate?.trim() &&
        item.endDate?.trim(),
    );
}

export function isWorkExperienceEntryStarted(
    item?: Partial<ExperienceDetailsFormType["workExperience"][number]> | null,
) {
    if (!item) return false;
    return Boolean(
        item.employer?.trim() ||
        item.position?.trim() ||
        item.startDate?.trim() ||
        item.endDate?.trim(),
    );
}

export const educationActiveFieldPaths = (index: number) =>
    [
        `education.${index}.institutionName`,
        `education.${index}.country`,
        `education.${index}.startDate`,
        `education.${index}.endDate`,
        `education.${index}.courseName`,
    ] as const;

export const workExperienceActiveFieldPaths = (index: number) =>
    [
        `workExperience.${index}.employer`,
        `workExperience.${index}.position`,
        `workExperience.${index}.startDate`,
        `workExperience.${index}.endDate`,
    ] as const;

export const useManageExperienceForm = () => {
    const {
        experience, setExperience,
        savedEducationCount, savedWorkCount,
        setSavedEducationCount, setSavedWorkCount,
        _hasHydrated,
    } = useApplicationFormStore();
    const { data: draft } = useGetApplicationDraft();
    const hydratedFromDraftRef = useRef(false);
    const hydratedFromStoreRef = useRef(false);

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

    // Prefer server draft when available; only fall back to local draft once.
    useEffect(() => {
        const registration = draft?.data?.registration;
        if (!registration || hydratedFromDraftRef.current) return;

        hydratedFromDraftRef.current = true;

        const hasEducation = (registration.educations?.length ?? 0) > 0;
        const hasExperience = (registration.experiences?.length ?? 0) > 0;

        const education = hasEducation
            ? registration.educations.map((item) => ({
                institutionId: item.institutionId ?? "",
                institutionName: item.institutionName ?? "",
                country: item.location ?? "",
                startDate: toDateInputValue(item.startDate),
                endDate: toDateInputValue(item.endDate),
                courseName: item.qualification ?? "",
                attachment: item.attachmentUrl ?? item.attachment ?? undefined,
            }))
            : [{ ...defaultEducation }];

        const workExperience = hasExperience
            ? registration.experiences.map((item) => ({
                employer: item.employerName ?? "",
                position: item.position ?? "",
                startDate: toDateInputValue(item.startDate),
                endDate: toDateInputValue(item.endDate),
            }))
            : [{ ...defaultWorkExperience }];

        const educationCount = hasEducation ? registration.educations.length : 0;
        const workCount = hasExperience ? registration.experiences.length : 0;

        setSavedEducationCount(educationCount);
        setSavedWorkCount(workCount);

        form.reset({
            education: hasEducation
                ? [...education, { ...defaultEducation }]
                : education,
            workExperience: hasExperience
                ? [...workExperience, { ...defaultWorkExperience }]
                : workExperience,
            cvAttachment: registration.cvAttachment ?? undefined,
        });
    }, [draft, form, setSavedEducationCount, setSavedWorkCount]);

    useEffect(() => {
        if (!_hasHydrated || hydratedFromDraftRef.current || hydratedFromStoreRef.current) {
            return;
        }
        if (Object.keys(experience).length === 0) return;

        hydratedFromStoreRef.current = true;
        form.reset(experience as Partial<ExperienceDetailsFormType>);
    }, [_hasHydrated, experience, form]);

    const watched = useWatch({ control: form.control });
    useEffect(() => {
        if (!_hasHydrated) return;
        setExperience(watched);
    }, [watched, _hasHydrated, setExperience]);

    const saveAndAddEducation = async () => {
        const isValid = await form.trigger(
            [...educationActiveFieldPaths(savedEducationCount)],
            { shouldFocus: true },
        );
        if (!isValid) return;
        setSavedEducationCount(savedEducationCount + 1);
        educationFieldArray.append({ ...defaultEducation });
    };

    const removeEducation = (index: number) => {
        educationFieldArray.remove(index);
        setSavedEducationCount(Math.max(0, savedEducationCount - 1));
    };

    const saveAndAddWorkExperience = async () => {
        const isValid = await form.trigger(
            [...workExperienceActiveFieldPaths(savedWorkCount)],
            { shouldFocus: true },
        );
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
