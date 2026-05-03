// references.tsx (page)
import {useNavigate} from "react-router";
import ReferenceForm from "./forms/reference-form";
import {FormProvider} from "react-hook-form";
import {
    useManageReferenceDetailsForm,
    type ReferenceDetailsFormType
} from "./forms/manage-reference-forms";
import { useSubmitReferenceDetails } from "./repository/useSubmitReferenceDetails";
import FormPageLayout from "~/routes/application/components/form-page-layout";

const References = () => {
    const navigate = useNavigate();
    const form = useManageReferenceDetailsForm();

    const mutation = useSubmitReferenceDetails(() =>
        navigate("/application/submission", {replace: true})
    );

    const submit = (value: ReferenceDetailsFormType) => {
        console.log(value);
        mutation.mutate(value);
    };

    return (
        <FormProvider {...form}>
            <form
                onSubmit={form.handleSubmit(submit)}
                className="w-full"
            >
                <FormPageLayout
                    stepNumber={4}
                    title="References"
                    subtitle="Enter your proposer and supporter details."
                    backHref="/application/experience"
                    isPending={mutation.isPending}
                >
                    <ReferenceForm/>
                </FormPageLayout>
            </form>
        </FormProvider>
    );
};

export default References;