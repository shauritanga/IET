import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useGetApplicationDraft } from "~/routes/application/repository/useResumeApplication";
import { getRegistrationStatusLabel, getReviewStageLabel } from "~/utils/application-status";
import { useNavigate } from "react-router";
import type { ApplicationReviewStage, ApplicationStatus } from "../type";

const timelineSteps: Array<{
    stage: ApplicationReviewStage;
    label: string;
    description: string;
}> = [
    {
        stage: "SECRETARIAT_REVIEW",
        label: "Reviewed by Secretariat",
        description: "Your application has been received and is undergoing initial verification.",
    },
    {
        stage: "EVALUATOR_REVIEW",
        label: "Assigned to Evaluator",
        description: "An evaluator is reviewing your qualifications and submitted documents.",
    },
    {
        stage: "MPDC_REVIEW",
        label: "Reviewed by MPDC",
        description: "The Membership & Professional Development Committee is reviewing the evaluator outcome.",
    },
    {
        stage: "COUNCIL_REVIEW",
        label: "Approved by Council",
        description: "Your application is with the council for the final membership decision.",
    },
    {
        stage: "APPROVAL_NOTICE_SENT",
        label: "Approval Note Sent",
        description: "Your approval notice has been prepared and shared with you.",
    },
];

const formatDateTime = (value?: string | null) => {
    if (!value) return "Pending";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getCurrentStepIndex = (status?: ApplicationStatus | null, stage?: ApplicationReviewStage | null) => {
    if (status === "APPROVED") return timelineSteps.length - 1;
    const index = timelineSteps.findIndex((step) => step.stage === stage);
    return index >= 0 ? index : 0;
};

export default function WelcomePage() {
    const navigate = useNavigate();
    const { data } = useGetApplicationDraft();
    const registration = data?.data.registration;
    const currentStage = registration?.reviewStage ?? data?.data.reviewStage ?? "SECRETARIAT_REVIEW";
    const currentIndex = getCurrentStepIndex(registration?.status, currentStage);
    const stageTimestamps = new Map(
        registration?.stageHistory?.map((entry) => [entry.toStage, entry.createdAt]) ?? [],
    );

    return (
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 py-6">
            <div className="space-y-2 text-center">
                <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#4D302A]">
                    Membership Application Status
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-6 text-[#7A7773]">
                    Your application is active in the review workflow. You can follow every stage here until the final decision is reached.
                </p>
            </div>

            <Card className="rounded-[24px] border border-[#EFE5E1] bg-white px-5 py-5 shadow-[0_12px_28px_rgba(95,69,60,0.06)] md:px-6">
                <div className="grid gap-4 border-b border-[#F3E8E4] pb-5 md:grid-cols-[1.4fr_1fr_1fr]">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A5938E]">Reference Number</p>
                        <p className="mt-1 text-[17px] font-semibold text-[#4D302A]">
                            {registration?.referenceNumber || "Awaiting Reference"}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A5938E]">Application Status</p>
                        <p className="mt-1 text-[15px] font-medium text-[#5A3D38]">
                            {getRegistrationStatusLabel(registration?.status)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A5938E]">Current Review Stage</p>
                        <p className="mt-1 text-[15px] font-medium text-[#5A3D38]">
                            {getReviewStageLabel(currentStage)}
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-5">
                    {timelineSteps.map((step, index) => {
                        const isDone = index < currentIndex || registration?.status === "APPROVED";
                        const isActive = index === currentIndex && registration?.status === "IN_REVIEW";
                        const isFinalDone = step.stage === "APPROVAL_NOTICE_SENT" && registration?.status === "APPROVED";

                        return (
                            <div key={step.stage} className="flex gap-4">
                                <div className="flex w-7 flex-col items-center">
                                    <div
                                        className={[
                                            "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold",
                                            isDone || isFinalDone
                                                ? "border-[#48A764] bg-[#DDF7E5] text-[#2F7E4A]"
                                                : isActive
                                                    ? "border-[#A86454] bg-[#F8EEE9] text-[#7C4C41]"
                                                    : "border-[#E7D8D3] bg-white text-[#A5938E]",
                                        ].join(" ")}
                                    >
                                        {isDone || isFinalDone ? "✓" : index + 1}
                                    </div>
                                    {index < timelineSteps.length - 1 ? (
                                        <div className={`mt-1 h-10 w-px ${isDone ? "bg-[#D2E9D9]" : "bg-[#EEE4E0]"}`} />
                                    ) : null}
                                </div>

                                <div className="flex-1 rounded-[18px] border border-[#F0E5E1] bg-[#FFFDFC] px-4 py-3">
                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                        <h2 className="text-[15px] font-semibold text-[#4D302A]">{step.label}</h2>
                                        <p className="text-xs text-[#9C8882]">
                                            {index < currentIndex || isFinalDone
                                                ? formatDateTime(stageTimestamps.get(step.stage) ?? registration?.stageUpdatedAt)
                                                : isActive
                                                    ? "In progress"
                                                    : "Pending"}
                                        </p>
                                    </div>
                                    <p className="mt-1.5 text-sm leading-6 text-[#746B67]">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {registration?.status === "CHANGES_REQUESTED" ? (
                    <div className="mt-5 rounded-[18px] border border-[#F6D9B4] bg-[#FFF6E8] px-4 py-3 text-sm text-[#7A5A22]">
                        Changes were requested on your application. Update the required sections and resubmit to move back to secretariat review.
                    </div>
                ) : null}

                {registration?.status === "REJECTED" ? (
                    <div className="mt-5 rounded-[18px] border border-[#F1D6D2] bg-[#FFF5F4] px-4 py-3 text-sm text-[#8B4B43]">
                        This application was not approved. The administration team has recorded a final decision on this submission.
                    </div>
                ) : null}

                <div className="mt-6 flex justify-center">
                    <Button size="lg" onClick={() => navigate("/dashboard", { replace: true })}>
                        Go to Dashboard
                    </Button>
                </div>
            </Card>
        </section>
    );
}
