import {Field, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Input} from "~/components/ui/input";
import {BirthDatePicker, formatLocalDate} from "~/components/custom/birth-date-picker";
import {Separator} from "~/components/ui/separator";
import {Button} from "~/components/ui/button";
import {PlusIcon, Trash2, GraduationCap, Briefcase, CheckIcon, ChevronsUpDown} from "lucide-react";
import {Controller, useFormContext} from "react-hook-form";
import type {UseFieldArrayReturn} from "react-hook-form";
import type {ExperienceDetailsFormType} from "./manage-experience-details-form";
import {FilePickerCard} from '~/components/custom/file-pickers/file-picker-card';
import {useQuery} from "@tanstack/react-query";
import http from "~/utils/http";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/ui/spinner";

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
    const {
        data: institutions = [],
        isLoading: institutionsLoading,
        isError: institutionsError,
    } = useQuery({
        queryKey: ["engineering-institutions"],
        queryFn: getEngineeringInstitutions,
    });

    const {fields: educationFields} = educationFieldArray;
    const {fields: workFields} = workExperienceFieldArray;
    const selectedInstitutionId = watch(`education.${savedEducationCount}.institutionId`);
    const selectedInstitutionName = watch(`education.${savedEducationCount}.institutionName`);
    const selectedInstitutionValue = selectedInstitutionId || (selectedInstitutionName ? "OTHER" : "");
    const isOtherInstitution = selectedInstitutionValue === "OTHER";
    const currentYear = new Date().getFullYear();

    const handleInstitutionSelect = (value: string) => {
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
    };

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
                    <p className="md:col-span-2 text-[12.5px] text-[var(--iet-muted)] leading-relaxed">
                        Fill in your education below. Click <strong>Save &amp; Continue</strong> when you are done —
                        you do not need to click “Add another” unless you have more than one institution.
                    </p>
                    <Field className={isOtherInstitution ? "" : "md:col-span-2"}>
                        <FieldLabel>Institution Name</FieldLabel>
                        <InstitutionCombobox
                            value={selectedInstitutionValue}
                            onChange={handleInstitutionSelect}
                            institutions={institutions}
                            isLoading={institutionsLoading}
                            isError={institutionsError}
                        />
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
                            readOnly={!isOtherInstitution && !!selectedInstitutionId && selectedInstitutionId !== "OTHER"}
                        />
                    </Field>
                    <Field>
                        <FieldLabel>Start Date</FieldLabel>
                        <Controller
                            name={`education.${savedEducationCount}.startDate`}
                            control={control}
                            render={({field}) => (
                                <BirthDatePicker
                                    placeholder="Select start date"
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) =>
                                        field.onChange(date ? formatLocalDate(date) : "")
                                    }
                                    fromYear={1960}
                                    toYear={currentYear}
                                    disabled={{ after: new Date() }}
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
                                    placeholder="Select end date"
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) =>
                                        field.onChange(date ? formatLocalDate(date) : "")
                                    }
                                    fromYear={1960}
                                    toYear={currentYear + 6}
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
                        <span>Add another institution (optional)</span>
                    </Button>
                    <Separator orientation="horizontal" className="shrink"/>
                </div>
            </div>

            {/* ── Work Experience Section ── */}
            <div className="flex flex-col gap-8">
                <h3 className="text-base font-semibold">Work Experience</h3>
                <p className="text-[12.5px] text-[var(--iet-muted)] leading-relaxed -mt-4">
                    Optional. Fill in a role below if you have work experience. Use “Add another” only for additional positions.
                </p>

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
                                    placeholder="Select start date"
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) =>
                                        field.onChange(date ? formatLocalDate(date) : "")
                                    }
                                    fromYear={1960}
                                    toYear={currentYear}
                                    disabled={{ after: new Date() }}
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
                                    placeholder="Select end date"
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) =>
                                        field.onChange(date ? formatLocalDate(date) : "")
                                    }
                                    fromYear={1960}
                                    toYear={currentYear}
                                    disabled={{ after: new Date() }}
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
                        <span>Add another position (optional)</span>
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

type InstitutionComboboxProps = {
    value?: string;
    onChange: (value: string) => void;
    institutions: EngineeringInstitution[];
    isLoading: boolean;
    isError: boolean;
};

function InstitutionCombobox({
    value,
    onChange,
    institutions,
    isLoading,
    isError,
}: InstitutionComboboxProps) {
    const [open, setOpen] = useState(false);
    const selectedInstitution =
        value === "OTHER"
            ? null
            : institutions.find((institution) => institution.id === value);

    const label = isLoading
        ? "Loading institutions..."
        : isError
            ? "Unable to load institutions"
            : value === "OTHER"
                ? "Other institution"
                : selectedInstitution
                    ? `${selectedInstitution.name} (${selectedInstitution.country})`
                    : "Search and select institution";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isLoading || isError}
                    className="h-11 w-full justify-between rounded-xl border-[1.5px] border-[var(--iet-border)] bg-[var(--iet-bg)] px-3 shadow-none hover:bg-white hover:border-[var(--iet-red)]/40"
                >
                    <span className={cn("truncate text-left", !selectedInstitution && value !== "OTHER" && "text-[var(--iet-muted)]")}>
                        {label}
                    </span>
                    {isLoading ? (
                        <Spinner />
                    ) : (
                        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search institution..." />
                    <CommandList>
                        <ScrollArea className="h-72">
                            <CommandEmpty>No institution found.</CommandEmpty>
                            <CommandGroup>
                                {institutions.map((institution) => (
                                    <CommandItem
                                        key={institution.id}
                                        value={`${institution.name} ${institution.country}`}
                                        onSelect={() => {
                                            onChange(institution.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <CheckIcon
                                            className={cn(
                                                "mr-2 size-4",
                                                value === institution.id ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        <span className="flex min-w-0 flex-col">
                                            <span className="truncate font-medium">{institution.name}</span>
                                            <span className="text-xs text-[var(--iet-muted)]">
                                                {institution.country}
                                                {institution.institutionType
                                                    ? ` · ${institution.institutionType.toLowerCase()}`
                                                    : ""}
                                            </span>
                                        </span>
                                    </CommandItem>
                                ))}
                                <CommandItem
                                    value="Other institution"
                                    onSelect={() => {
                                        onChange("OTHER");
                                        setOpen(false);
                                    }}
                                >
                                    <CheckIcon
                                        className={cn(
                                            "mr-2 size-4",
                                            value === "OTHER" ? "opacity-100" : "opacity-0",
                                        )}
                                    />
                                    Other institution (not listed)
                                </CommandItem>
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default ExperienceDetailsForm;

