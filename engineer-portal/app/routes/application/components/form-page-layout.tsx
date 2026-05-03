import { Link } from "react-router";
import { Spinner } from "~/components/ui/spinner";

type FormPageLayoutProps = {
    stepNumber: number;
    totalSteps?: number;
    title: string;
    subtitle: string;
    backHref?: string;
    isPending?: boolean;
    submitLabel?: string;
    children: React.ReactNode;
};

const FormPageLayout = ({
    stepNumber,
    totalSteps = 5,
    title,
    subtitle,
    backHref,
    isPending = false,
    submitLabel = "Save & Continue",
    children,
}: FormPageLayoutProps) => {
    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-1.5 self-start bg-[var(--iet-red-pale)] border border-[var(--iet-border)] text-[#390909] text-[10px] font-bold uppercase tracking-[0.8px] px-3 py-1 rounded-full">
                    Step {stepNumber} of {totalSteps}
                </div>
                <h2
                    style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                    className="text-[26px] font-bold text-[#390909] leading-tight"
                >
                    {title}
                </h2>
                <p className="text-[13px] text-[var(--iet-muted)]">{subtitle}</p>
            </div>

            {/* White Card */}
            <div className="bg-white rounded-2xl border border-[var(--iet-border)] shadow-[var(--shadow-md)] p-6 md:p-8">
                {children}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-2">
                {backHref ? (
                    <Link to={backHref}>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 border border-[var(--iet-border)] bg-white text-[#390909] px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-[var(--iet-red)] hover:text-[var(--iet-red)] transition-colors"
                        >
                            ← Back
                        </button>
                    </Link>
                ) : (
                    <div />
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 bg-[var(--iet-red)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--iet-red-mid)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isPending && <Spinner className="size-4" />}
                    {submitLabel} →
                </button>
            </div>
        </div>
    );
};

export default FormPageLayout;
