// references.tsx (page)
import {Button} from "~/components/ui/button";
import {Link, useNavigate} from "react-router";
import ReferenceForm from "./forms/reference-form";
import {FormProvider} from "react-hook-form";
import {
    useManageReferenceDetailsForm,
    type ReferenceDetailsFormType
} from "./forms/manage-reference-forms";
import { useSubmitReferenceDetails } from "./repository/useSubmitReferenceDetails";
import {Spinner} from "~/components/ui/spinner";

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
                className="flex flex-col justify-between w-full h-full max-w-2xl space-y-4"
            >
                <div>
                    <h2 className="text-xl font-semibold">References</h2>
                    <p className="text-sm font-light text-[#7A7773]">Enter your references</p>
                </div>
                <div className="overflow-y-scroll flex-1 pt-4 md:pt-10 no-scrollbar px-1">
                    <ReferenceForm/>
                </div>
                <div className="w-full flex items-center justify-between">
                    <Link to="/application/experience">
                        <Button size="lg">Back</Button>
                    </Link>
                    <div className="hidden lg:block"/>
                    <Button type={"submit"} size={"lg"} disabled={mutation.isPending}>
                        {mutation.isPending ? <Spinner/> : "Continue"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

export default References;