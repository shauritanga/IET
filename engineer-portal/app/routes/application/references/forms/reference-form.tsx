import {Field, FieldError, FieldGroup, FieldLabel} from "~/components/ui/field";
import {Input} from "~/components/ui/input";
import {NativeSelect, NativeSelectOption} from "~/components/ui/native-select";
import type {ReferenceDetailsFormType} from "./manage-reference-forms";
import {useFormContext} from "react-hook-form";

type ReferenceSectionProps = {
    prefix: "proposer" | "supporter";
    number: 1 | 2;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    gradeOptions: { value: string; label: string; disabled?: boolean }[];
};

const RELATIONSHIP_OPTIONS = [
    "Current Supervisor / Manager",
    "Former Supervisor / Manager",
    "Senior Colleague",
    "Academic Supervisor",
    "Professional Mentor",
    "Client / Project Partner",
];

const ReferenceSection = ({ prefix, number, title, subtitle, badge, badgeColor, gradeOptions }: ReferenceSectionProps) => {
    const { register, formState: { errors } } = useFormContext<ReferenceDetailsFormType>();
    const fieldErrors = errors[prefix];

    return (
        <div className="rounded-xl border border-[var(--iet-border)] overflow-hidden bg-white">
            {/* Card Header */}
            <div className="bg-[#FDF0F0] px-[18px] py-[13px] border-b border-[var(--iet-border)] flex items-center gap-[10px]">
                <div className="w-7 h-7 rounded-full bg-[#E20C0A] text-white text-[12px] font-extrabold flex items-center justify-center shrink-0">
                    {number}
                </div>
                <div>
                    <div className="text-[13px] font-bold text-[#390909]">{title}</div>
                    <div className="text-[10.5px] text-[var(--iet-muted)] mt-[1px]">{subtitle}</div>
                </div>
                <div className="ml-auto">
                    <span className={`text-[10px] font-bold px-[10px] py-[3px] rounded-[20px] tracking-[0.4px] uppercase ${badgeColor}`}>
                        {badge}
                    </span>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-[18px]">
                <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <Field>
                        <FieldLabel>Full Name *</FieldLabel>
                        <Input placeholder="Referee's full name" {...register(`${prefix}.fullName`)} />
                        {fieldErrors?.fullName && <FieldError>{fieldErrors.fullName.message}</FieldError>}
                    </Field>

                    {/* Membership Number */}
                    <Field>
                        <FieldLabel>IET Membership No. *</FieldLabel>
                        <Input
                            placeholder="e.g. IET/XXXX/XXXX"
                            style={{ fontFamily: "'Courier New', monospace", letterSpacing: "1px" }}
                            {...register(`${prefix}.membershipNumber`)}
                        />
                        {fieldErrors?.membershipNumber && <FieldError>{fieldErrors.membershipNumber.message}</FieldError>}
                    </Field>

                    {/* Membership Grade */}
                    <Field className={prefix === "supporter" ? "md:col-span-2" : ""}>
                        <FieldLabel>
                            Membership Grade *{" "}
                            {prefix === "supporter" && (
                                <span className="text-[#E20C0A] font-bold text-[10px] normal-case tracking-normal">
                                    (Corporate Member or Fellow only)
                                </span>
                            )}
                        </FieldLabel>
                        <NativeSelect {...register(`${prefix}.membershipCategory`)}>
                            <NativeSelectOption value="">Select grade…</NativeSelectOption>
                            {gradeOptions.map((opt) => (
                                <NativeSelectOption key={opt.value} value={opt.value} disabled={opt.disabled}>
                                    {opt.label}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {fieldErrors?.membershipCategory && <FieldError>{fieldErrors.membershipCategory.message}</FieldError>}
                    </Field>

                    {/* Organisation */}
                    <Field>
                        <FieldLabel>Organisation / Employer *</FieldLabel>
                        <Input placeholder="Where they currently work" {...register(`${prefix}.organisation`)} />
                        {fieldErrors?.organisation && <FieldError>{fieldErrors.organisation.message}</FieldError>}
                    </Field>

                    {/* Email */}
                    <Field>
                        <FieldLabel>Email Address *</FieldLabel>
                        <Input type="email" placeholder="referee@email.com" {...register(`${prefix}.email`)} />
                        {fieldErrors?.email && <FieldError>{fieldErrors.email.message}</FieldError>}
                    </Field>

                    {/* Phone */}
                    <Field>
                        <FieldLabel>Phone Number *</FieldLabel>
                        <Input placeholder="+255 7XX XXX XXX" {...register(`${prefix}.phoneNumber`)} />
                        {fieldErrors?.phoneNumber && <FieldError>{fieldErrors.phoneNumber.message}</FieldError>}
                    </Field>

                    {/* Relationship — full width */}
                    <Field className="md:col-span-2">
                        <FieldLabel>Relationship to Applicant *</FieldLabel>
                        <NativeSelect {...register(`${prefix}.relationship`)}>
                            <NativeSelectOption value="">Select…</NativeSelectOption>
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                                <NativeSelectOption key={opt} value={opt}>{opt}</NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {fieldErrors?.relationship && <FieldError>{fieldErrors.relationship.message}</FieldError>}
                    </Field>
                </FieldGroup>
            </div>
        </div>
    );
};

const PROPOSER_GRADES = [
    { value: "Student Member", label: "Student Member" },
    { value: "Graduate Member", label: "Graduate Member" },
    { value: "Associate Member", label: "Associate Member" },
    { value: "Corporate Member", label: "Corporate Member" },
    { value: "Fellow", label: "Fellow" },
    { value: "Honorary Fellow", label: "Honorary Fellow" },
];

const SUPPORTER_GRADES = [
    { value: "Corporate Member", label: "Corporate Member" },
    { value: "Fellow", label: "Fellow" },
    { value: "Honorary Fellow", label: "Honorary Fellow" },
    { value: "Student Member", label: "Student Member (not eligible)", disabled: true },
    { value: "Graduate Member", label: "Graduate Member (not eligible)", disabled: true },
    { value: "Associate Member", label: "Associate Member (not eligible)", disabled: true },
];

const ReferenceForm = () => {
    return (
        <div className="space-y-[18px]">
            {/* Info notice */}
            <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-[10px] px-4 py-[13px] flex gap-[10px] items-start">
                <svg width="16" height="16" fill="none" stroke="#F57F17" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-[1px]">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-[11.5px] text-[#5D4037] leading-relaxed">
                    <strong>Reference 1</strong> must be a current IET Tanzania member of any grade.{" "}
                    <strong>Reference 2</strong> must be a{" "}
                    <span className="text-[#390909] font-bold">Corporate Member or Fellow</span>{" "}
                    of IET Tanzania. Both referees must know you professionally.
                </p>
            </div>

            <ReferenceSection
                prefix="proposer"
                number={1}
                title="Reference 1"
                subtitle="Any grade IET Tanzania member"
                badge="Any Member Grade"
                badgeColor="bg-[rgba(26,107,60,.1)] text-[#1a6b3c]"
                gradeOptions={PROPOSER_GRADES}
            />
            <ReferenceSection
                prefix="supporter"
                number={2}
                title="Reference 2"
                subtitle="Must be a Corporate Member or Fellow of IET Tanzania"
                badge="Corporate / Fellow Only"
                badgeColor="bg-[rgba(226,12,10,.1)] text-[#390909] border border-[rgba(226,12,10,.2)]"
                gradeOptions={SUPPORTER_GRADES}
            />
        </div>
    );
};

export default ReferenceForm;
