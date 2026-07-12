import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { User, UserId, SquareAcademicCap, UsersGroupRounded, FileCheck, Letter } from "@solar-icons/react";
import { MoonStar, SunMedium } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/ui/spinner";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { getApplicationRoute } from "~/routes/application/repository/useResumeApplication";
import { useThemeMode } from "~/providers/theme";
import type { ApplicationStep } from "~/routes/application/type";

// Maps sidebar step index → backend RegistrationStep key
const STEP_KEYS: ApplicationStep[] = [
    "PERSONAL_DETAILS",
    "REGISTRATION_DETAILS",
    "EDUCATION_EXPERIENCE",
    "REFERENCES",
    "EMAIL_VERIFICATION",
    "PAYMENT",
];

// Step URL segments in order — used for "is this path ahead of allowed?" check
const STEP_PATHS = [
    "/application/personal-details",
    "/application/registration-details",
    "/application/experience",
    "/application/references",
    "/application/verify-email",
    "/application/submission",
];

function isAheadOfAllowedStep(currentPath: string, allowedPath: string): boolean {
    const currentIdx = STEP_PATHS.findIndex((p) => currentPath.startsWith(p));
    const allowedIdx = STEP_PATHS.findIndex((p) => allowedPath.startsWith(p));
    if (currentIdx === -1 || allowedIdx === -1) return false;
    return currentIdx > allowedIdx;
}

function getStepIndexFromPath(stepPath: string): number {
    return STEP_PATHS.findIndex((path) => stepPath.startsWith(path));
}

const RegisterLayout = () => {
    const path = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useThemeMode();

    const { isLoading: isDraftLoading, isError, data: draft } = useGetApplicationDraft();

    const completedSteps: ApplicationStep[] = draft?.data?.completedSteps ?? [];

    const steps = [
        {
            label: "Personal Details",
            link: "/application/personal-details",
            description: "Provide your personal details",
            icon: <User weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Registration Details",
            link: "/application/registration-details",
            description: "Provide your identification details",
            icon: <UserId weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Education & Work Experience",
            link: "/application/experience",
            description: "Complete your educational background",
            icon: <SquareAcademicCap weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "References",
            link: "/application/references",
            description: "Enter your references",
            icon: <UsersGroupRounded weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Verify Email",
            link: "/application/verify-email",
            description: "Confirm your email address",
            icon: <Letter weight={"BoldDuotone"} size={20} />,
        },
        {
            label: "Declaration & Submission",
            link: "/application/submission",
            description: "Finalise registration submission",
            icon: <FileCheck weight={"BoldDuotone"} size={20} />,
        },
    ];

    const isWelcomePage = path.pathname.includes("/application/welcome");
    const isCurrentStep = (step: string) => path.pathname.startsWith(step);
    const currentStepIndex = isWelcomePage
        ? steps.length
        : steps.findIndex((step) => isCurrentStep(step.link));
    const allowedPath = draft?.data ? getApplicationRoute(draft.data) : "/application/personal-details";
    const allowedStepIndex = getStepIndexFromPath(allowedPath);

    // Sidebar completion driven by backend completedSteps, not URL position
    const isStepCompleted = (stepIndex: number) =>
        isWelcomePage || completedSteps.includes(STEP_KEYS[stepIndex]);

    // Route guard: fires on every navigation
    useEffect(() => {
        if (!draft?.data?.hasActiveRegistration) return;

        const currentPath = path.pathname;
        const targetPath = getApplicationRoute(draft.data);

        if (isAheadOfAllowedStep(currentPath, targetPath)) {
            navigate(targetPath, { replace: true });
        }
    }, [draft, path.pathname, navigate]);

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
        <div className="flex h-screen overflow-hidden bg-[var(--iet-bg)] text-[var(--iet-text)]">
            {/* Left sidebar */}
            <div className="w-[300px] min-w-[300px] bg-[var(--iet-white)] border-r border-[var(--iet-border)] flex flex-col justify-between p-8 overflow-y-auto">
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

                        {/* Progress bar */}
                        {!isWelcomePage && currentStepIndex >= 0 && (
                            <div className="mb-4 px-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-semibold text-[var(--iet-muted)]">
                                        Step {currentStepIndex + 1} of {steps.length}
                                    </span>
                                    <span className="text-[10px] font-semibold text-[var(--iet-muted)]">
                                        {Math.round((currentStepIndex / steps.length) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-[var(--iet-border)]">
                                    <div
                                        className="h-1 rounded-full bg-[var(--iet-red)] transition-all duration-500"
                                        style={{ width: `${(currentStepIndex / steps.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {steps.map((step, index) => {
                            const completed = isStepCompleted(index);
                            const active = isCurrentStep(step.link) && !isWelcomePage;
                            const canNavigateToStep = completed || index <= allowedStepIndex;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={!canNavigateToStep}
                                    onClick={() => canNavigateToStep && navigate(step.link)}
                                    className={cn(
                                        "flex w-full items-start text-left transition-opacity",
                                        canNavigateToStep ? "cursor-pointer hover:opacity-85" : "cursor-not-allowed opacity-65",
                                    )}
                                    title={completed ? "Edit this completed step" : canNavigateToStep ? "Continue this step" : "Complete earlier steps first"}
                                >
                                    <div className="flex flex-col items-center mr-3 shrink-0">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                                                completed
                                                    ? "bg-green-600 text-white shadow-[0_0_0_3px_rgba(34,197,94,0.18)]"
                                                    : active
                                                    ? "bg-[var(--iet-red)] text-white shadow-[0_0_0_4px_rgba(226,12,10,0.14)]"
                                                    : "bg-[var(--iet-red-pale)] text-[var(--iet-muted)] border border-[var(--iet-border)]"
                                            )}
                                        >
                                            {completed ? (
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
                                        <p
                                            className={cn(
                                                "text-sm font-semibold leading-tight",
                                                active || completed ? "text-[var(--iet-red-dark)]" : "text-[var(--iet-muted)]"
                                            )}
                                        >
                                            {step.label}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-[11px] mt-0.5",
                                                active || completed ? "text-[var(--iet-muted)]" : "text-[var(--iet-muted)] opacity-70"
                                            )}
                                        >
                                            {step.description}
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
                    className="mt-6 text-sm font-medium text-[var(--iet-muted)] hover:text-[var(--iet-red)] transition-colors text-left"
                >
                    ← Cancel Application
                </button>
            </div>

            {/* Right content */}
            <div className="flex-1 overflow-y-auto bg-[var(--iet-bg)]">
                <div className="min-h-full flex justify-center px-12 py-9">
                    <div className="w-full max-w-[800px]">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterLayout;
