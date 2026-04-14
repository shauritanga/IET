// reference-form.tsx
import {Field, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Input} from "~/components/ui/input";
import {NativeSelect, NativeSelectOption} from "~/components/ui/native-select";
import {BirthDatePicker} from "~/components/custom/birth-date-picker";
import type {ReferenceDetailsFormType} from "./manage-reference-forms";
import {Controller, useFormContext} from "react-hook-form";

// ─── Reusable Reference Section ──────────────────────────────────────────────

type ReferenceSectionProps = {
    prefix: "proposer" | "supporter";
    title: string;
    description: string;
};

const ReferenceSection = ({prefix, title, description}: ReferenceSectionProps) => {
    const {register, control, formState: {errors}} = useFormContext<ReferenceDetailsFormType>();

    const fieldErrors = errors[prefix];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="lg:col-span-2 text-sm">
                <h2 className="font-medium">{title}</h2>
                <p className="font-light">{description}</p>
            </div>

            {/* Full Name */}
            <Field className="lg:col-span-2">
                <FieldLabel>Full Name</FieldLabel>
                <Input
                    type="text"
                    placeholder={`Enter ${prefix} full name`}
                    {...register(`${prefix}.fullName`)}
                />
                {fieldErrors?.fullName && (
                    <FieldError>{fieldErrors.fullName.message}</FieldError>
                )}
            </Field>

            {/* Membership Category */}
            <Field>
                <FieldLabel>Membership Category</FieldLabel>
                <NativeSelect
                    className="bg-white h-11 shadow-none!"
                    {...register(`${prefix}.membershipCategory`)}
                >
                    <NativeSelectOption value="">Select</NativeSelectOption>
                    <NativeSelectOption value="fellow">Fellow</NativeSelectOption>
                    <NativeSelectOption value="senior_member">Senior Member</NativeSelectOption>
                    <NativeSelectOption value="corporate_member">Corporate Member</NativeSelectOption>
                </NativeSelect>
                {fieldErrors?.membershipCategory && (
                    <FieldError>{fieldErrors.membershipCategory.message}</FieldError>
                )}
            </Field>

            {/* Membership Number */}
            <Field>
                <FieldLabel>Membership Number</FieldLabel>
                <Input
                    type="text"
                    placeholder="Enter membership number"
                    {...register(`${prefix}.membershipNumber`)}
                />
                {fieldErrors?.membershipNumber && (
                    <FieldError>{fieldErrors.membershipNumber.message}</FieldError>
                )}
            </Field>
        </div>
    );
};

// ─── Main Form ───────────────────────────────────────────────────────────────

const ReferenceForm = () => {
    return (
        <FieldGroup className="space-y-8">
            <ReferenceSection
                prefix="proposer"
                title="PROPOSER INFORMATION"
                description="Must be an IET Fellow or Senior Member depending on category"
            />
            <ReferenceSection
                prefix="supporter"
                title="SUPPORTER INFORMATION"
                description="Must be at least a Corporate Member of IET"
            />
        </FieldGroup>
    );
};

export default ReferenceForm;