
import {Field, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {NativeSelect, NativeSelectOption} from "~/components/ui/native-select";
import {Input} from "~/components/ui/input";
import {BirthDatePicker} from "~/components/custom/birth-date-picker";
import {Building2, Pencil, PlusIcon, Trash2} from "lucide-react";
import type {RegistrationDetailsFormType} from './manage-registration-details-form';
import type {UseFieldArrayReturn} from "react-hook-form";
import {Controller, useFormContext} from "react-hook-form";
import PillRadioGroup from "~/components/custom/pill-radio-groups";
import { FilePickerCard } from "~/components/custom/file-pickers/file-picker-card";
import {Separator} from "~/components/ui/separator";
import {Button} from "~/components/ui/button";


// ─── Types ───────────────────────────────────────────────────────────────────

type InstitutionsFieldArray = UseFieldArrayReturn<RegistrationDetailsFormType, "institutions">;

type Props = {
    institutionsFieldArray: InstitutionsFieldArray;
    savedInstitutionCount:number;
    saveAndAddInstitution: () => void;
    removeInstitution: (index: number) => void;
};


// ─── Institution Card ────────────────────────────────────────────────────────

const InstitutionCard = ({
    institutionName,
    registrationDate,
    classRegistered,
    onRemove,
}: {
    institutionName: string;
    registrationDate: string;
    classRegistered: string;
    onRemove: () => void;
}) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-red-400"/>
            </div>
            <div>
                <p className="font-medium text-gray-800">{institutionName || "New Institution"}</p>
                <p className="text-sm text-gray-500">
                    {registrationDate
                        ? new Date(registrationDate).toLocaleDateString()
                        : ""
                    }
                    {classRegistered && ` • ${classRegistered}`}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Pencil className="w-4 h-4"/>
            </button>
            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-red-400 hover:text-red-600 transition-colors"
            >
                <Trash2 className="w-4 h-4"/>
            </button>
        </div>
    </div>
);

// ─── Main Form ───────────────────────────────────────────────────────────────

const RegistrationDetailsForm = ({institutionsFieldArray, savedInstitutionCount, saveAndAddInstitution, removeInstitution}: Props) => {
    const {
        register,
        control,
        watch,
        formState: {errors},
    } = useFormContext<RegistrationDetailsFormType>();

    const {fields} = institutionsFieldArray;

    const isRegisteredWithStatutoryBoard = watch("registeredWithStatutoryBoard");
    const isMemberOfinstitutions = watch("memberOfOtherInstitutions");


    const yesNoOptions = [
        {label: "Yes", value: "true"},
        {label: "No", value: "false"},
    ];


    return (
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Engineering Discipline */}
            <Field className="md:col-span-2">
                <FieldLabel>Engineering Discipline</FieldLabel>
                <NativeSelect
                    className="bg-white h-11 shadow-none!"
                    {...register("engineeringDiscipline")}
                >
                    <NativeSelectOption value="">Select discipline</NativeSelectOption>
                    <NativeSelectOption value="Mechanical">Mechanical</NativeSelectOption>
                    <NativeSelectOption value="Civil">Civil</NativeSelectOption>
                    <NativeSelectOption value="Electrical">Electrical</NativeSelectOption>
                    <NativeSelectOption value="Chemical">Chemical</NativeSelectOption>
                    <NativeSelectOption value="Electronics">Electronics</NativeSelectOption>
                    <NativeSelectOption value="Mining">Mining</NativeSelectOption>
                    <NativeSelectOption value="Agricultural">Agricultural</NativeSelectOption>
                    <NativeSelectOption value="Environmental">Environmental</NativeSelectOption>
                    <NativeSelectOption value="Computer">Computer</NativeSelectOption>
                    <NativeSelectOption value="Telecommunications">Telecommunications</NativeSelectOption>
                    <NativeSelectOption value="Petroleum">Petroleum</NativeSelectOption>
                    <NativeSelectOption value="Biomedical">Biomedical</NativeSelectOption>
                    <NativeSelectOption value="Industrial">Industrial</NativeSelectOption>
                    <NativeSelectOption value="Aeronautical">Aeronautical</NativeSelectOption>
                </NativeSelect>
                {errors.engineeringDiscipline && (
                    <p className="text-red-500 text-xs mt-1">{errors.engineeringDiscipline.message}</p>
                )}
            </Field>

            {/* Registration Category */}
            <Field className="md:col-span-2">
                <FieldLabel>Registration Category</FieldLabel>
                <NativeSelect  {...register("appliedMembershipType")} className="bg-white h-11 shadow-none!">
                    <NativeSelectOption value="">Select category</NativeSelectOption>
                    <NativeSelectOption value="member">Member</NativeSelectOption>
                    <NativeSelectOption value="fellow">Fellow</NativeSelectOption>
                    <NativeSelectOption value="associate">Associate</NativeSelectOption>
                </NativeSelect>
            </Field>

            {/* Registered with Statutory Boards */}
            <Field className="md:col-span-2">
                <FieldLabel>Are you registered with other statutory boards</FieldLabel>
                <Controller
                    control={control}
                    name="registeredWithStatutoryBoard"
                    render={({field}) => (
                        <PillRadioGroup
                            options={yesNoOptions}
                            value={String(field.value ?? "")}
                            onValueChange={(val) => field.onChange(val === "true")}
                            idPrefix="statutory"
                        />
                    )}
                />
            </Field>

            {/* Supporting Document Upload — conditional */}
            {isRegisteredWithStatutoryBoard && (
                <Field className="w-full md:col-span-2">
                                <FieldLabel className="text-wrap">
                                    Upload supporting documents.
                                </FieldLabel>
                                <Controller
                                    name="supportingDocument"
                                    control={control}
                                    render={({field}) => (
                                        <FilePickerCard
                                            instructionText={"Upload a clear copy of your document(PDF,DOCX) - 24MB Max"}
                                            mode={"auto-upload"}
                                            onChange={(file) => field.onChange(file?.url)}
                                            onBlur={field.onBlur}
                                        />
                                    )}
                                />
                                {errors.supportingDocument && (
                                    <FieldError>{errors.supportingDocument.message}</FieldError>
                                )}
                            </Field>
            )}

            {/* Member of Other Engineering Institutions */}
            <Field className="md:col-span-2">
                <FieldLabel>Are you a member of other engineering institutions</FieldLabel>
                <Controller
                    control={control}
                    name="memberOfOtherInstitutions"
                    render={({field}) => (
                        <PillRadioGroup
                            options={yesNoOptions}
                            value={String(field.value ?? "")}
                            onValueChange={(val) => field.onChange(val === "true")}
                            idPrefix="member-institutions"
                        />
                    )}
                />
            </Field>

            {/* Institutions Field Array — conditional */}
            {isMemberOfinstitutions && (
                <div className="md:col-span-2 flex flex-col gap-3">

                    {/* Only show entries that have been explicitly saved */}
                    {fields.slice(0, savedInstitutionCount).map((field, index) => (
                        <InstitutionCard
                            key={field.id}
                            institutionName={field.institutionName}
                            registrationDate={field.registrationDate}
                            classRegistered={field.classRegistered}
                            onRemove={() => removeInstitution(index)}
                        />
                    ))}

                    {/* Active form always uses savedInstitutionCount as its index */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel>Institution name</FieldLabel>
                            <Input
                                placeholder="Enter institution name"
                                {...register(`institutions.${savedInstitutionCount}.institutionName`)}
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Registration Date</FieldLabel>
                            <Controller
                                name={`institutions.${savedInstitutionCount}.registrationDate`}
                                control={control}
                                render={({field}) => (
                                    <BirthDatePicker
                                        value={field.value ? new Date(field.value) : undefined}
                                        onChange={(date) => field.onChange(date?.toISOString())}
                                    />
                                )}
                            />
                            {errors.institutions?.[savedInstitutionCount]?.registrationDate && (
                                <FieldError>
                                    {errors.institutions[savedInstitutionCount]?.registrationDate?.message}
                                </FieldError>
                            )}
                        </Field>
                        <Field className="md:col-span-2">
                            <FieldLabel>Class registered</FieldLabel>
                            <Input
                                placeholder="Enter class registered"
                                {...register(`institutions.${savedInstitutionCount}.classRegistered`)}
                            />
                        </Field>
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <Separator orientation="horizontal" className="shrink" />
                        <Button
                            type="button"
                            variant="outline"
                            className="flex items-center gap-2 whitespace-nowrap"
                            onClick={saveAndAddInstitution}
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add another institution</span>
                        </Button>
                        <Separator orientation="horizontal" className="shrink" />
                    </div>
                </div>
            )}

        </FieldGroup>
    );
};

export default RegistrationDetailsForm;