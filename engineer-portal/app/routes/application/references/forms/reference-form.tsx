import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import type { ReferenceDetailsFormType } from "./manage-reference-forms";
import { useFormContext } from "react-hook-form";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import {
    loadReferenceCandidate,
    useSearchReferenceCandidates,
} from "../repository/useSearchReferenceCandidates";
import type { ReferenceRole } from "../requests/search-reference-candidates";
import toast from "react-hot-toast";

type ReferenceSectionProps = {
    prefix: ReferenceRole;
    number: 1 | 2;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    excludeMembershipNumber?: string;
};

const RELATIONSHIP_OPTIONS = [
    "Current Supervisor / Manager",
    "Former Supervisor / Manager",
    "Senior Colleague",
    "Academic Supervisor",
    "Professional Mentor",
    "Client / Project Partner",
];

const emptyReferee = {
    fullName: "",
    membershipCategory: "",
    membershipNumber: "",
    organisation: "",
    email: "",
    phoneNumber: "",
    relationship: "",
};

const ReferenceSection = ({
    prefix,
    number,
    title,
    subtitle,
    badge,
    badgeColor,
    excludeMembershipNumber,
}: ReferenceSectionProps) => {
    const {
        register,
        setValue,
        watch,
        clearErrors,
        formState: { errors },
    } = useFormContext<ReferenceDetailsFormType>();
    const fieldErrors = errors[prefix];
    const selectedMembershipNumber = watch(`${prefix}.membershipNumber`);
    const selectedFullName = watch(`${prefix}.fullName`);
    const selectedCategory = watch(`${prefix}.membershipCategory`);
    const selectedRelationship = watch(`${prefix}.relationship`);

    const [query, setQuery] = useState("");
    const [isSelecting, setIsSelecting] = useState(false);
    const searchEnabled = !selectedMembershipNumber;

    const { data: candidates = [], isFetching, isError } = useSearchReferenceCandidates(
        query,
        prefix,
        searchEnabled,
    );

    const filteredCandidates = useMemo(
        () =>
            candidates.filter(
                (candidate) => candidate.membershipNumber !== excludeMembershipNumber,
            ),
        [candidates, excludeMembershipNumber],
    );

    const clearSelection = () => {
        const relationship = selectedRelationship || "";
        setValue(prefix, { ...emptyReferee, relationship }, { shouldDirty: true, shouldValidate: true });
        setQuery("");
    };

    const selectCandidate = async (membershipNumber: string) => {
        setIsSelecting(true);
        try {
            const details = await loadReferenceCandidate(membershipNumber, prefix);
            setValue(
                prefix,
                {
                    fullName: details.fullName,
                    membershipCategory: details.membershipCategory,
                    membershipNumber: details.membershipNumber,
                    organisation: details.organisation || "",
                    email: details.email || "",
                    phoneNumber: details.phoneNumber || "",
                    relationship: selectedRelationship || "",
                },
                { shouldDirty: true, shouldValidate: true },
            );
            clearErrors(prefix);
            setQuery("");
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ??
                    "Could not load that member. Please try another search.",
            );
        } finally {
            setIsSelecting(false);
        }
    };

    return (
        <div className="rounded-xl border border-[var(--iet-border)] overflow-hidden bg-[var(--iet-white)]">
            <div className="bg-[var(--iet-red-pale)] px-[18px] py-[13px] border-b border-[var(--iet-border)] flex items-center gap-[10px]">
                <div className="w-7 h-7 rounded-full bg-[var(--iet-red)] text-white text-[12px] font-extrabold flex items-center justify-center shrink-0">
                    {number}
                </div>
                <div>
                    <div className="text-[13px] font-bold text-[var(--iet-red-dark)]">{title}</div>
                    <div className="text-[10.5px] text-[var(--iet-muted)] mt-[1px]">{subtitle}</div>
                </div>
                <div className="ml-auto">
                    <span
                        className={`text-[10px] font-bold px-[10px] py-[3px] rounded-[20px] tracking-[0.4px] uppercase ${badgeColor}`}
                    >
                        {badge}
                    </span>
                </div>
            </div>

            <div className="p-[18px] space-y-4">
                {!selectedMembershipNumber ? (
                    <Field>
                        <FieldLabel>Search member *</FieldLabel>
                        <div className="relative">
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Type name or membership number…"
                                autoComplete="off"
                            />
                            {(isFetching || isSelecting) && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-[var(--iet-muted)] mt-1.5">
                            Enter at least 2 characters. Only existing active IET members can be selected.
                        </p>
                        {fieldErrors?.membershipNumber && (
                            <FieldError>{fieldErrors.membershipNumber.message}</FieldError>
                        )}

                        {query.trim().length >= 2 && (
                            <div className="mt-2 rounded-lg border border-[var(--iet-border)] bg-white overflow-hidden">
                                {isError ? (
                                    <div className="px-3 py-3 text-[12px] text-[var(--iet-red-dark)]">
                                        Unable to search members. Please try again.
                                    </div>
                                ) : isFetching && filteredCandidates.length === 0 ? (
                                    <div className="px-3 py-3 text-[12px] text-[var(--iet-muted)]">
                                        Searching…
                                    </div>
                                ) : filteredCandidates.length === 0 ? (
                                    <div className="px-3 py-3 text-[12px] text-[var(--iet-muted)]">
                                        No matching members found.
                                    </div>
                                ) : (
                                    <ul className="max-h-56 overflow-y-auto divide-y divide-[var(--iet-border)]">
                                        {filteredCandidates.map((candidate) => (
                                            <li key={candidate.membershipNumber}>
                                                <button
                                                    type="button"
                                                    disabled={isSelecting}
                                                    onClick={() => selectCandidate(candidate.membershipNumber)}
                                                    className="w-full text-left px-3 py-2.5 hover:bg-[var(--iet-red-pale)] transition-colors disabled:opacity-50"
                                                >
                                                    <div className="text-[13px] font-semibold text-[var(--iet-red-dark)]">
                                                        {candidate.fullName}
                                                    </div>
                                                    <div className="text-[11px] text-[var(--iet-muted)] mt-0.5 flex flex-wrap gap-x-2">
                                                        <span
                                                            style={{
                                                                fontFamily: "'Courier New', monospace",
                                                                letterSpacing: "0.5px",
                                                            }}
                                                        >
                                                            {candidate.membershipNumber}
                                                        </span>
                                                        <span>·</span>
                                                        <span>{candidate.membershipCategory}</span>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </Field>
                ) : (
                    <div className="rounded-lg border border-[var(--iet-border)] bg-[#FAFAFA] px-3.5 py-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-[13px] font-bold text-[var(--iet-red-dark)]">
                                    {selectedFullName}
                                </div>
                                <div className="text-[11.5px] text-[var(--iet-muted)] mt-1 space-y-0.5">
                                    <div
                                        style={{
                                            fontFamily: "'Courier New', monospace",
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        {selectedMembershipNumber}
                                    </div>
                                    <div>{selectedCategory}</div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearSelection}
                                className="shrink-0"
                            >
                                Change
                            </Button>
                        </div>
                    </div>
                )}

                {/* Hidden autofill fields kept for submit payload */}
                <input type="hidden" {...register(`${prefix}.fullName`)} />
                <input type="hidden" {...register(`${prefix}.membershipNumber`)} />
                <input type="hidden" {...register(`${prefix}.membershipCategory`)} />
                <input type="hidden" {...register(`${prefix}.organisation`)} />
                <input type="hidden" {...register(`${prefix}.email`)} />
                <input type="hidden" {...register(`${prefix}.phoneNumber`)} />

                <FieldGroup className="grid grid-cols-1 gap-3">
                    <Field>
                        <FieldLabel>Relationship to Applicant *</FieldLabel>
                        <NativeSelect {...register(`${prefix}.relationship`)}>
                            <NativeSelectOption value="">Select…</NativeSelectOption>
                            {RELATIONSHIP_OPTIONS.map((opt) => (
                                <NativeSelectOption key={opt} value={opt}>
                                    {opt}
                                </NativeSelectOption>
                            ))}
                        </NativeSelect>
                        {fieldErrors?.relationship && (
                            <FieldError>{fieldErrors.relationship.message}</FieldError>
                        )}
                    </Field>
                </FieldGroup>
            </div>
        </div>
    );
};

const ReferenceForm = () => {
    const { watch } = useFormContext<ReferenceDetailsFormType>();
    const proposerNumber = watch("proposer.membershipNumber");
    const supporterNumber = watch("supporter.membershipNumber");

    return (
        <div className="space-y-[18px]">
            <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-[10px] px-4 py-[13px] flex gap-[10px] items-start">
                <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="#F57F17"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="shrink-0 mt-[1px]"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[11.5px] text-[#5D4037] leading-relaxed">
                    Search and select existing IET Tanzania members.{" "}
                    <strong>Reference 1</strong> can be any active member grade.{" "}
                    <strong>Reference 2</strong> must be a{" "}
                    <span className="text-[var(--iet-red-dark)] font-bold">
                        Corporate Member, Fellow, or Honorary Fellow
                    </span>
                    . Both must already exist in the system.
                </p>
            </div>

            <ReferenceSection
                prefix="proposer"
                number={1}
                title="Reference 1"
                subtitle="Search any active IET Tanzania member"
                badge="Any Member Grade"
                badgeColor="bg-[rgba(26,107,60,.1)] text-[#1a6b3c]"
                excludeMembershipNumber={supporterNumber}
            />
            <ReferenceSection
                prefix="supporter"
                number={2}
                title="Reference 2"
                subtitle="Search Corporate Member, Fellow, or Honorary Fellow only"
                badge="Corporate / Fellow Only"
                badgeColor="bg-[var(--iet-red-pale)] text-[var(--iet-red-dark)] border border-[var(--iet-border)]"
                excludeMembershipNumber={proposerNumber}
            />
        </div>
    );
};

export default ReferenceForm;
