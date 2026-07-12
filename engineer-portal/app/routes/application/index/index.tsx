import { Spinner } from "~/components/ui/spinner";
import { useResumeApplication } from "~/routes/application/repository/useResumeApplication";

export default function ApplicationIndex() {
    useResumeApplication();

    return (
        <div className="flex min-h-dvh items-center justify-center">
            <Spinner className="size-8" />
        </div>
    );
}
