import {Field, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Input} from "~/components/ui/input";
import {BirthDatePicker} from "~/components/custom/birth-date-picker";
import {Separator} from "~/components/ui/separator";
import {Button} from "~/components/ui/button";
import {PlusIcon, Trash2, GraduationCap, Briefcase} from "lucide-react";
import {Controller, useFormContext} from "react-hook-form";
import type {UseFieldArrayReturn} from "react-hook-form";
import type {ExperienceDetailsFormType} from "./manage-experience-details-form";
import {FilePickerCard} from '~/components/custom/file-pickers/file-picker-card';
import {useQuery} from "@tanstack/react-query";
import http from "~/utils/http";

type EngineeringInstitution = {
    id: string;
    name: string;
    country: string;
    institutionType?: string;
    recognitionStatus?: string;
};

async function getEngineeringInstitutions() {
    const response = await http.get<{ data: EngineeringInstitution[] }>("/registrations/engineering-institutions");
    return response.data.data ?? [];
}

type Props = {
    educationFieldArray: UseFieldArrayReturn<ExperienceDetailsFormType, "education">;
    workExperienceFieldArray: UseFieldArrayReturn<ExperienceDetailsFormType, "workExperience">;
    savedEducationCount: number;
    savedWorkCount: number;
    saveAndAddEducation: () => void;
    removeEducation: (index: number) => void;
    saveAndAddWorkExperience: () => void;
    removeWorkExperience: (index: number) => void;
};

const EducationCard = ({
                           institutionName, courseName, startDate, endDate, onRemove,
                       }: {
    institutionName: string;
    courseName: string;
    startDate: string;
    endDate: string;
    onRemove: () => void;
}) => (
    <div className="flex items-center justify-between p-4 bg-[var(--iet-white)] rounded-xl border border-[var(--iet-border)] shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-400"/>
            </div>
            <div>
                <p className="font-medium">{institutionName || "New Institution"}</p>
                <p className="text-sm text-[var(--iet-muted)]">
                    {courseName && `${courseName} • `}{startDate} – {endDate}
                </p>
            </div>
        </div>
        <button type="button" onClick={onRemove} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4"/>
        </button>
    </div>
);

const WorkExperienceCard = ({
                                employer, position, startDate, endDate, onRemove,
                            }: {
    employer: string;
    position: string;
    startDate: string;
    endDate: string;
    onRemove: () => void;
}) => (
    <div className="flex items-center justify-between p-4 bg-[var(--iet-white)] rounded-xl border border-[var(--iet-border)] shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-green-400"/>
            </div>
            <div>
                <p className="font-medium text-[var(--iet-text)]">{employer || "New Employer"}</p>
                <p className="text-sm text-[var(--iet-muted)]">
                    {position && `${position} • `}{startDate} – {endDate}
                </p>
            </div>
        </div>
        <button type="button" onClick={onRemove} className="p-2 text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4"/>
        </button>
    </div>
);

const ExperienceDetailsForm = ({
                                   educationFieldArray,
                                   workExperienceFieldArray,
                                   savedEducationCount,
                                   savedWorkCount,
                                   saveAndAddEducation,
                                   removeEducation,
                                   saveAndAddWorkExperience,
                               removeWorkExperience,
                           }: Props) => {
    const {register, control, setValue, watch, formState: {errors}} = useFormContext<ExperienceDetailsFormType>();
    const {data: institutions = []} = useQuery({
        queryKey: ["engineering-institutions"],
        queryFn: getEngineeringInstitutions,
    });

    const {fields: educationFields} = educationFieldArray;
    const {fields: workFields} = workExperienceFieldArray;
    const selectedInstitutionId = watch(`education.${savedEducationCount}.institutionId`);
    const selectedInstitutionName = watch(`education.${savedEducationCount}.institutionName`);
    const selectedInstitutionValue = selectedInstitutionId || (selectedInstitutionName ? "OTHER" : "");
    const isOtherInstitution = selectedInstitutionValue === "OTHER";

    return (
        <div className="flex flex-col gap-8">

            {/* ── Education Section ── */}
            <div className="flex flex-col gap-8">
                <h3 className="text-base font-semibold">Education</h3>

                {/* Saved education cards */}
                {educationFields.slice(0, savedEducationCount).map((field, index) => (
                    <EducationCard
                        key={field.id}
                        institutionName={field.institutionName}
                        courseName={field.courseName}
                        startDate={field.startDate}
                        endDate={field.endDate}
                        onRemove={() => removeEducation(index)}
                    />
                ))}

                {/* Active education form — always bound to savedEducationCount */}
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field className={isOtherInstitution ? "" : "md:col-span-2"}>
                        <FieldLabel>Institution Name</FieldLabel>
                        <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={selectedInstitutionValue}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value === "OTHER") {
                                    setValue(`education.${savedEducationCount}.institutionId`, "OTHER", {shouldDirty: true});
                                    setValue(`education.${savedEducationCount}.institutionName`, "", {shouldDirty: true});
                                    setValue(`education.${savedEducationCount}.country`, "", {shouldDirty: true});
                                    return;
                                }

                                const institution = institutions.find((item) => item.id === value);
                                setValue(`education.${savedEducationCount}.institutionId`, value, {shouldDirty: true});
                                setValue(`education.${savedEducationCount}.institutionName`, institution?.name ?? "", {shouldDirty: true});
                                setValue(`education.${savedEducationCount}.country`, institution?.country ?? "", {shouldDirty: true});
                            }}
                        >
                            <option value="">Select institution</option>
                            {institutions.map((institution) => (
                                <option key={institution.id} value={institution.id}>
                                    {institution.name} ({institution.country})
                                </option>
                            ))}
                            <option value="OTHER">Other institution</option>
                        </select>
                        <input type="hidden" {...register(`education.${savedEducationCount}.institutionId`)} />
                        {!isOtherInstitution && (
                            <input type="hidden" {...register(`education.${savedEducationCount}.institutionName`)} />
                        )}
                    </Field>
                    {isOtherInstitution && (
                        <Field>
                            <FieldLabel>Other Institution Name</FieldLabel>
                            <Input
                                placeholder="Enter institution name"
                                {...register(`education.${savedEducationCount}.institutionName`)}
                            />
                        </Field>
                    )}
                    <Field>
                        <FieldLabel>Country</FieldLabel>
                        <Input
                            placeholder="Enter country"
                            {...register(`education.${savedEducationCount}.country`)}
                            readOnly={!isOtherInstitution && !!selectedInstitutionId}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Start Date</FieldLabel>
                        <Controller
                            name={`education.${savedEducationCount}.startDate`}
                            control={control}
                            render={({field}) => (
                                <BirthDatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => field.onChange(date?.toISOString())}
                                />
                            )}
                        />
                        {errors.education?.[savedEducationCount]?.startDate && (
                            <FieldError>{errors.education[savedEducationCount]?.startDate?.message}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <FieldLabel>End Date</FieldLabel>
                        <Controller
                            name={`education.${savedEducationCount}.endDate`}
                            control={control}
                            render={({field}) => (
                                <BirthDatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => field.onChange(date?.toISOString())}
                                />
                            )}
                        />
                        {errors.education?.[savedEducationCount]?.endDate && (
                            <FieldError>{errors.education[savedEducationCount]?.endDate?.message}</FieldError>
                        )}
                    </Field>
                    <Field className="md:col-span-2">
                        <FieldLabel>Qualification / Course Name</FieldLabel>
                        <Input
                            placeholder="Enter course name"
                            {...register(`education.${savedEducationCount}.courseName`)}
                        />
                    </Field>
                    <Field className="w-full md:col-span-2">
                        <FieldLabel>Upload Certificate</FieldLabel>
                        <Controller
                            name={`education.${savedEducationCount}.attachment`}
                            control={control}
                            render={({field}) => (
                                <FilePickerCard
                                    mode="auto-upload"
                                    onChange={(file) => field.onChange(file?.url)}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                        {errors.education?.[savedEducationCount]?.attachment && (
                            <FieldError>{errors.education[savedEducationCount]?.attachment?.message}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <div className="flex items-center gap-2 w-full">
                    <Separator orientation="horizontal" className="shrink"/>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 whitespace-nowrap"
                        onClick={saveAndAddEducation}
                    >
                        <PlusIcon className="w-4 h-4"/>
                        <span>Add another institution</span>
                    </Button>
                    <Separator orientation="horizontal" className="shrink"/>
                </div>
            </div>

            {/* ── Work Experience Section ── */}
            <div className="flex flex-col gap-8">
                <h3 className="text-base font-semibold">Work Experience</h3>

                {/* Saved work experience cards */}
                {workFields.slice(0, savedWorkCount).map((field, index) => (
                    <WorkExperienceCard
                        key={field.id}
                        employer={field.employer}
                        position={field.position}
                        startDate={field.startDate}
                        endDate={field.endDate}
                        onRemove={() => removeWorkExperience(index)}
                    />
                ))}

                {/* Active work experience form — always bound to savedWorkCount */}
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
                    <Field>
                        <FieldLabel>Employer</FieldLabel>
                        <Input
                            placeholder="Enter employer name"
                            {...register(`workExperience.${savedWorkCount}.employer`)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Position</FieldLabel>
                        <Input
                            placeholder="Enter position"
                            {...register(`workExperience.${savedWorkCount}.position`)}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Start Date</FieldLabel>
                        <Controller
                            name={`workExperience.${savedWorkCount}.startDate`}
                            control={control}
                            render={({field}) => (
                                <BirthDatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => field.onChange(date?.toISOString())}
                                />
                            )}
                        />
                        {errors.workExperience?.[savedWorkCount]?.startDate && (
                            <FieldError>{errors.workExperience[savedWorkCount]?.startDate?.message}</FieldError>
                        )}
                    </Field>
                    <Field>
                        <FieldLabel>End Date</FieldLabel>
                        <Controller
                            name={`workExperience.${savedWorkCount}.endDate`}
                            control={control}
                            render={({field}) => (
                                <BirthDatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => field.onChange(date?.toISOString())}
                                />
                            )}
                        />
                        {errors.workExperience?.[savedWorkCount]?.endDate && (
                            <FieldError>{errors.workExperience[savedWorkCount]?.endDate?.message}</FieldError>
                        )}
                    </Field>
                </FieldGroup>

                <div className="flex items-center gap-2 w-full">
                    <Separator orientation="horizontal" className="shrink"/>
                    <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2 whitespace-nowrap"
                        onClick={saveAndAddWorkExperience}
                    >
                        <PlusIcon className="w-4 h-4"/>
                        <span>Add another position</span>
                    </Button>
                    <Separator orientation="horizontal" className="shrink"/>
                </div>
            </div>

            {/* ── CV Upload Section ── */}
            <FieldGroup>
                <Field className="w-full md:col-span-2">
                    <FieldLabel>Upload curriculum vitae</FieldLabel>
                    <Controller
                        name="cvAttachment"
                        control={control}
                        render={({field}) => (
                            <FilePickerCard
                                mode="auto-upload"
                                onChange={(file) => field.onChange(file?.url)}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                    {errors.cvAttachment && (
                        <FieldError>{errors.cvAttachment.message}</FieldError>
                    )}
                </Field>
            </FieldGroup>
        </div>
    );
};

export default ExperienceDetailsForm;
