import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { User, UserId, SquareAcademicCap, UsersGroupRounded, FileCheck, ClipboardCheck } from "@solar-icons/react";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/ui/spinner";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { useThemeMode } from "~/providers/theme";
import type { ApplicationStep } from "~/routes/application/type";
import {
    getApplicationRoute,
    getFarthestAllowedPath,
    getStepIndexFromPath,
    isAheadOfAllowedStep,
    isStepCompleted,
} from "~/routes/application/utils/application-steps";

type SidebarStep = {
    label: string;
    link: string;
    description: string;
    key: ApplicationStep | "REVIEW";
    icon: React.ReactNode;
};

const RegisterLayout = () => {
    const path = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useThemeMode();

    const { isLoading: isDraftLoading, isError, data: draft } = useGetApplicationDraft();

    const completedSteps: ApplicationStep[] = draft?.data?.completedSteps ?? [];
    const status = draft?.data?.status;
    const canEdit =
        !status || status === "DRAFT" || status === "CHANGES_REQUESTED";

    const steps: SidebarStep[] = [
        {
            label: "Personal Details",
            link: "/application/personal-details",
            description: "Provide your personal details",
            key: "PERSONAL_DETAILS",
            icon: <User weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Registration Details",
            link: "/application/registration-details",
            description: "Provide your identification details",
            key: "REGISTRATION_DETAILS",
            icon: <UserId weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Education & Work Experience",
            link: "/application/experience",
            description: "Complete your educational background",
            key: "EDUCATION_EXPERIENCE",
            icon: <SquareAcademicCap weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "References",
            link: "/application/references",
            description: "Enter your references",
            key: "REFERENCES",
            icon: <UsersGroupRounded weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Review",
            link: "/application/review",
            description: "Check and edit before submitting",
            key: "REVIEW",
            icon: <ClipboardCheck weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Declaration & Submission",
            link: "/application/submission",
            description: "Payment and final submission",
            key: "PAYMENT",
            icon: <FileCheck weight={"BoldDuotone"} size={20} />,
        },
    ];

    const isWelcomePage = path.pathname.includes("/application/welcome");
    const isCurrentStep = (step: string) => path.pathname.startsWith(step);
    const currentStepIndex = isWelcomePage
        ? steps.length
        : steps.findIndex((step) => isCurrentStep(step.link));
    const farthestPath = draft?.data
        ? getFarthestAllowedPath(draft.data)
        : "/application/personal-details";
    const farthestStepIndex = getStepIndexFromPath(farthestPath);

    // Route guard: block skipping ahead; allow revisiting completed steps
    useEffect(() => {
        if (!draft?.data?.hasActiveRegistration) return;
        if (!canEdit) return;

        const currentPath = path.pathname;
        if (currentPath.includes("/application/welcome")) return;

        if (isAheadOfAllowedStep(currentPath, farthestPath)) {
            navigate(getApplicationRoute(draft.data), { replace: true });
        }
    }, [draft, path.pathname, navigate, farthestPath, canEdit]);

    // Prevent document scroll so the sidebar never moves with page scroll chaining
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const previousHtmlOverflow = html.style.overflow;
        const previousBodyOverflow = body.style.overflow;
        const previousHtmlOverscroll = html.style.overscrollBehavior;
        const previousBodyOverscroll = body.style.overscrollBehavior;

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
        body.style.overscrollBehavior = "none";

        return () => {
            html.style.overflow = previousHtmlOverflow;
            body.style.overflow = previousBodyOverflow;
            html.style.overscrollBehavior = previousHtmlOverscroll;
            body.style.overscrollBehavior = previousBodyOverscroll;
        };
    }, []);

    if (isDraftLoading) {
        return (
            <div className="flex items-center justify-center min-h-dvh">
                <Spinner className="size-8" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
                <p className="text-red-600 font-medium">
                    Failed to initialise your application. Please try again.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-10 flex overflow-hidden overscroll-none bg-[var(--iet-bg)] text-[var(--iet-text)]">
            <aside className="flex h-full w-[300px] min-w-[300px] shrink-0 flex-col overflow-hidden border-r border-[var(--iet-border)] bg-[var(--iet-white)]">
                <div className="flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto overscroll-contain p-8">
                <div className="flex flex-col gap-10">
                    <div className="flex items-center justify-between gap-4">
                        <img src="/IET-Logo-2.png" alt="IET-logo" width={130} />
                        <button
                            type="button"
                            className="topbar-bell"
                            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            onClick={toggleTheme}
                        >
                            {theme === "dark"
                                ? <SunMedium className="h-[14px] w-[14px] stroke-[1.8]" />
                                : <MoonStar className="h-[14px] w-[14px] stroke-[1.8]" />}
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.8px] text-[var(--iet-muted)] mb-3">
                            Application Steps
                        </p>

                        {!isWelcomePage && currentStepIndex >= 0 && (
                            <div className="mb-4 px-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-semibold text-[var(--iet-muted)]">
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </span>
                                    <span className="text-[10px] font-semibold text-[var(--iet-muted)]">
                                        {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-[var(--iet-border)]">
                                    <div
                                        className="h-1 rounded-full bg-[var(--iet-red)] transition-all duration-500"
                                        style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {steps.map((step, index) => {
                            const completed = isWelcomePage || isStepCompleted(completedSteps, step.key);
                            const active = isCurrentStep(step.link) && !isWelcomePage;
                            const canNavigateToStep =
                                canEdit && (completed || index <= farthestStepIndex);

                            return (
                                <button
                                    key={step.link}
                                    type="button"
                                    disabled={!canNavigateToStep}
                                    onClick={() => canNavigateToStep && navigate(step.link)}
                                    className={cn(
                                        "flex w-full items-start text-left transition-opacity",
                                        canNavigateToStep ? "cursor-pointer hover:opacity-85" : "cursor-not-allowed opacity-65",
                                    )}
                                    title={
                                        completed && canEdit
                                            ? "Edit this section"
                                            : canNavigateToStep
                                              ? "Continue this step"
                                              : "Complete earlier steps first"
                                    }
                                >
                                    <div className="flex flex-col items-center mr-3 shrink-0">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                                                active
                                                    ? "bg-[var(--iet-red)] text-white shadow-[0_0_0_4px_rgba(226,12,10,0.14)]"
                                                    : completed
                                                      ? "bg-green-600 text-white shadow-[0_0_0_3px_rgba(34,197,94,0.18)]"
                                                      : "bg-[var(--iet-red-pale)] text-[var(--iet-muted)] border border-[var(--iet-border)]"
                                            )}
                                        >
                                            {completed && !active ? (
                                                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            ) : active ? (
                                                <span className="[&>svg]:size-4">{step.icon}</span>
                                            ) : (
                                                <span className="text-[11px] font-bold">{index + 1}</span>
                                            )}
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={cn(
                                                    "w-0.5 mt-1 mb-1 rounded-full transition-colors duration-300",
                                                    completed ? "bg-green-500" : "bg-[var(--iet-border)]"
                                                )}
                                                style={{ height: "32px" }}
                                            />
                                        )}
                                    </div>
                                    <div className={cn("pt-0.5", index < steps.length - 1 ? "pb-5" : "")}>
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={cn(
                                                    "text-sm font-semibold leading-tight",
                                                    active || completed ? "text-[var(--iet-red-dark)]" : "text-[var(--iet-muted)]"
                                                )}
                                            >
                                                {step.label}
                                            </p>
                                            {completed && canEdit && !active && (
                                                <span className="text-[9px] font-bold uppercase tracking-[0.4px] text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">
                                                    Edit
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={cn(
                                                "text-[11px] mt-0.5",
                                                "text-[var(--iet-muted)]",
                                                !(active || completed) && "opacity-70"
                                            )}
                                        >
                                            {completed && canEdit && !active
                                                ? "Saved — click to edit"
                                                : step.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/dashboard/membership", { replace: true })}
                    className="mt-auto shrink-0 text-left text-sm font-medium text-[var(--iet-muted)] transition-colors hover:text-[var(--iet-red)]"
                >
                    ← Cancel Application
                </button>
                </div>
            </aside>

            <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--iet-bg)]">
                <div className="flex justify-center px-12 py-9 pb-16">
                    <div className="w-full max-w-[800px]">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RegisterLayout;
