import { Link, useNavigate } from "react-router";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { Spinner } from "~/components/ui/spinner";
import type { Reference, Registration } from "~/routes/application/type";

function SectionCard({
    title,
    editHref,
    children,
}: {
    title: string;
    editHref: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-[var(--iet-border)] bg-[var(--iet-white)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--iet-border)] bg-[var(--iet-red-pale)]">
                <h3 className="text-[13px] font-bold text-[var(--iet-red-dark)]">{title}</h3>
                <Link
                    to={editHref}
                    className="text-[11.5px] font-bold text-[var(--iet-red)] hover:underline shrink-0"
                >
                    Edit
                </Link>
            </div>
            <div className="px-4 py-3.5 text-[12.5px] text-[var(--iet-text)] leading-relaxed">
                {children}
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="grid grid-cols-[140px_1fr] gap-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.4px] text-[var(--iet-muted)]">
                {label}
            </span>
            <span className="font-medium break-words">{value?.trim() ? value : "—"}</span>
        </div>
    );
}

function formatDate(value?: string | null) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function referenceLabel(ref: Reference) {
    return ref.referenceType === "PROPOSER" ? "Reference 1 (Proposer)" : "Reference 2 (Supporter)";
}

function ReviewContent({ registration }: { registration: Registration }) {
    const personal = registration.personalDetails;
    const details = registration.registrationDetails;
    const educations = registration.educations ?? [];
    const experiences = registration.experiences ?? [];
    const references = registration.references ?? [];

    return (
        <div className="space-y-4">
            <SectionCard title="Personal Details" editHref="/application/personal-details">
                <Row
                    label="Name"
                    value={[personal?.title, personal?.firstName, personal?.middleName, personal?.lastName]
                        .filter(Boolean)
                        .join(" ")}
                />
                <Row label="Gender" value={personal?.gender} />
                <Row label="Date of birth" value={formatDate(personal?.dateOfBirth)} />
                <Row label="Nationality" value={personal?.nationality} />
                <Row label="Phone" value={personal?.phoneNumber} />
                <Row label="Email" value={personal?.email} />
                <Row label="Employer" value={personal?.employer} />
                <Row label="Position" value={personal?.position} />
            </SectionCard>

            <SectionCard title="Registration Details" editHref="/application/registration-details">
                <Row label="Discipline" value={details?.engineeringDiscipline} />
                <Row label="Category" value={details?.registrationCategory} />
                <Row label="Membership class" value={details?.appliedMembershipClass} />
                <Row
                    label="Statutory boards"
                    value={details?.registeredWithStatutoryBoards ? "Yes" : "No"}
                />
                <Row
                    label="Other institutions"
                    value={details?.memberOfOtherInstitutions ? "Yes" : "No"}
                />
                {(details?.institutions?.length ?? 0) > 0 && (
                    <div className="mt-2 space-y-2">
                        {details.institutions.map((item, index) => (
                            <div
                                key={`${item.institutionName}-${index}`}
                                className="rounded-lg bg-[var(--iet-bg)] px-3 py-2 text-[12px]"
                            >
                                <div className="font-semibold">{item.institutionName}</div>
                                <div className="text-[var(--iet-muted)] mt-0.5">
                                    {item.classRegistered || "—"} · {formatDate(item.registrationDate)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Education & Experience" editHref="/application/experience">
                <div className="mb-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--iet-muted)] mb-1.5">
                        Education ({educations.length})
                    </div>
                    {educations.length === 0 ? (
                        <p className="text-[var(--iet-muted)]">No education records.</p>
                    ) : (
                        <div className="space-y-2">
                            {educations.map((item) => (
                                <div key={item.id} className="rounded-lg bg-[var(--iet-bg)] px-3 py-2">
                                    <div className="font-semibold">{item.institutionName}</div>
                                    <div className="text-[var(--iet-muted)] text-[12px] mt-0.5">
                                        {[item.qualification, item.fieldOfStudy].filter(Boolean).join(" · ")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--iet-muted)] mb-1.5">
                        Work experience ({experiences.length})
                    </div>
                    {experiences.length === 0 ? (
                        <p className="text-[var(--iet-muted)]">No work experience records.</p>
                    ) : (
                        <div className="space-y-2">
                            {experiences.map((item) => (
                                <div key={item.id} className="rounded-lg bg-[var(--iet-bg)] px-3 py-2">
                                    <div className="font-semibold">{item.position}</div>
                                    <div className="text-[var(--iet-muted)] text-[12px] mt-0.5">
                                        {item.employerName}
                                        {item.isCurrent ? " · Current" : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SectionCard>

            <SectionCard title="References" editHref="/application/references">
                {references.length === 0 ? (
                    <p className="text-[var(--iet-muted)]">No references added.</p>
                ) : (
                    <div className="space-y-3">
                        {references.map((ref) => (
                            <div key={ref.id} className="rounded-lg bg-[var(--iet-bg)] px-3 py-2">
                                <div className="text-[11px] font-bold text-[var(--iet-muted)] uppercase tracking-[0.4px]">
                                    {referenceLabel(ref)}
                                </div>
                                <div className="font-semibold mt-1">{ref.fullName}</div>
                                <div className="text-[12px] text-[var(--iet-muted)] mt-0.5">
                                    {ref.membershipNumber} · {ref.membershipCategory}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

const ReviewPage = () => {
    const navigate = useNavigate();
    const { data: draft, isLoading } = useGetApplicationDraft();
    const registration = draft?.data?.registration;

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (!registration) {
        return (
            <div className="rounded-xl border border-[var(--iet-border)] bg-[var(--iet-white)] p-8 text-center">
                <p className="text-[13px] text-[var(--iet-muted)]">No application draft found.</p>
                <button
                    type="button"
                    className="mt-4 text-[13px] font-bold text-[var(--iet-red)]"
                    onClick={() => navigate("/application/personal-details")}
                >
                    Start application
                </button>
            </div>
        );
    }

    const isEditable =
        registration.status === "DRAFT" || registration.status === "CHANGES_REQUESTED";

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[var(--iet-red-dark)] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                    Step 5 of 6
                </div>
                <h2
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    className="text-[26px] font-bold text-[var(--iet-red-dark)] leading-tight"
                >
                    Review your application
                </h2>
                <p className="text-[13px] text-[var(--iet-muted)]">
                    {isEditable
                        ? "Check each section carefully. Use Edit to update anything before payment and final submission."
                        : "Your application has been submitted. Details below are read-only."}
                </p>
            </div>

            <ReviewContent registration={registration} />

            <div className="flex justify-between items-center pt-2">
                <Link to="/application/references">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 border border-[var(--iet-border)] bg-[var(--iet-white)] text-[var(--iet-red-dark)] px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-[var(--iet-red)] hover:text-[var(--iet-red)] transition-colors"
                    >
                        ← Back
                    </button>
                </Link>

                {isEditable ? (
                    <button
                        type="button"
                        onClick={() => navigate("/application/submission")}
                        className="inline-flex items-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--iet-red-mid)] transition-colors shadow-sm"
                    >
                        Continue to payment & submission →
                    </button>
                ) : (
                    <Link to="/application/welcome">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
                        >
                            View status →
                        </button>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default ReviewPage;
