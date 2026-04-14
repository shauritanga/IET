import { type LoaderFunctionArgs, Outlet, redirect, useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import {
    FileCheck,
    User,
    UsersGroupRounded,
    UserId,
    SquareAcademicCap,
    VerifiedCheck,
} from "@solar-icons/react/ssr";
import { cn } from "~/lib/utils";
import { Spinner } from "~/components/ui/spinner";
import { useLogout } from "~/routes/auth/logout";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { useInitializeApplication } from "~/routes/application/repository/useInitializeApplication";

const RegisterLayout = () => {
    const path = useLocation();
    const logout = useLogout();

    // 1️⃣ Auto-create draft if no applicationId cookie exists (runs once on mount)
    const { isInitializing, isError } = useInitializeApplication();

    // 2️⃣ Fetch the draft data (only meaningful once we have an applicationId)
    const { isLoading: isDraftLoading } = useGetApplicationDraft();

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
            label: "Declaration & Submission",
            link: "/application/submission",
            description: "Finalise registration submission",
            icon: <FileCheck weight={"BoldDuotone"} size={20} />,
        },
    ];

    const isWelcomePage = path.pathname.includes("/application/welcome");
    const isCurrentStep = (step: string) => path.pathname.includes(step);
    const currentStepIndex = isWelcomePage
        ? steps.length
        : steps.findIndex((step) => isCurrentStep(step.link));
    const isStepCompleted = (stepIndex: number) => currentStepIndex > stepIndex;
    const isConnectorActive = (stepIndex: number) => currentStepIndex > stepIndex;

    // Block render while either initializing the draft OR loading existing draft data
    if (isInitializing || isDraftLoading) {
        return (
            <div className="flex items-center justify-center min-h-dvh">
                <Spinner className="size-8" />
            </div>
        );
    }

    // Surface draft creation errors gracefully
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
        <div className="flex flex-col lg:flex-row lg:gap-4 w-full lg:min-h-dvh">
            {/* Mobile top bar */}
            <div className={"p-4 fixed w-full z-50 bg-white flex flex-col gap-2 lg:hidden"}>
                <div className="space-y-2 flex flex-col items-center">
                    <img src={"/IET-Logo-2.png"} alt={"IET-logo"} width={120} />
                    <h1 className={"text-lg font-semibold text-center"}>IET Membership Application</h1>
                </div>
                <div
                    className="grid pt-2"
                    style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
                >
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-1",
                                isStepCompleted(index) || isCurrentStep(step.link) || isWelcomePage
                                    ? "bg-[#390909]"
                                    : "bg-neutral-200"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className={"w-1/3 p-6 lg:px-8 lg:flex flex-col justify-between space-y-4 relative hidden"}>
                <div className={"space-y-20"}>
                    <div className="space-y-4 flex flex-col items-start">
                        <img src={"/IET-Logo-2.png"} alt={"IET-logo"} width={150} />
                    </div>
                    <div className={"space-y-8 flex flex-col items-start w-full"}>
                        <h1 className={"text-xl font-semibold text-center"}>IET Membership Application</h1>
                        <div className={"flex flex-col gap-2 items-start w-full"}>
                            {steps.map((step, index) => (
                                <div key={index} className={"flex items-start w-full"}>
                                    <div className={"flex flex-col items-center mr-4"}>
                                        <div className={cn("border rounded-lg p-2 bg-white shrink-0 border-gray-200")}>
                                            <span
                                                className={cn(
                                                    isCurrentStep(step.link) || isStepCompleted(index)
                                                        ? "text-[#390909]"
                                                        : "text-[#969393]"
                                                )}
                                            >
                                                {step.icon}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={"w-0.5 flex-1 mt-1 min-h-6"}
                                                style={{
                                                    backgroundColor: isConnectorActive(index) ? "#390909" : "#e5e7eb",
                                                }}
                                            />
                                        )}
                                    </div>

                                    <div className={"flex justify-between items-start w-full pb-6"}>
                                        <div>
                                            <h3
                                                className={cn(
                                                    "text-md font-semibold",
                                                    isCurrentStep(step.link) || isStepCompleted(index)
                                                        ? "text-[#390909]"
                                                        : "text-[#969393]"
                                                )}
                                            >
                                                {step.label}
                                            </h3>
                                            <p
                                                className={cn(
                                                    "text-sm font-light max-w-100",
                                                    isCurrentStep(step.link) || isStepCompleted(index)
                                                        ? "text-[#390909]"
                                                        : "text-[#969393]"
                                                )}
                                            >
                                                {step.description}
                                            </p>
                                        </div>
                                        <div className={"shrink-0 ml-2"}>
                                            {isCurrentStep(step.link) && !isWelcomePage ? (
                                                <Spinner className="text-green-600 size-6" />
                                            ) : isStepCompleted(index) ? (
                                                <VerifiedCheck
                                                    weight="BoldDuotone"
                                                    size={24}
                                                    className="text-green-600"
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <Button onClick={logout} variant={"outline"} size={"lg"} className={"w-fit text-red-600"}>
                    Cancel
                </Button>
            </div>

            {/* Main content */}
            <div className={"relative w-full lg:w-2/3 lg:p-4 mt-32 lg:mt-0 lg:max-h-dvh overflow-hidden"}>
                <div
                    className={
                        "w-full flex justify-center h-full rounded-4xl overflow-y-auto no-scrollbar lg:bg-[#F5F0F0] p-4 lg:pb-4 lg:pt-8"
                    }
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default RegisterLayout;