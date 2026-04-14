import {Button} from "~/components/ui/button";
import PersonalDetailsForm from "~/routes/application/personal-details/forms/personal-details-form";
import {useNavigate} from "react-router"
import {FormProvider} from "react-hook-form";
import {
    type PersonalDetailsFormType,
    useManagePersonalDetailsForm
} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import {useSubmitPersonalDetails} from "~/routes/application/personal-details/repository/useSubmitPersonalDetails";
import {Spinner} from "~/components/ui/spinner";
import type {TErrorMessage} from "~/types/types";


const PersonalDetails = () => {
    const navigate = useNavigate();
    const {form} = useManagePersonalDetailsForm();

    const handleValidationError = (error: TErrorMessage) => {
        const fieldErrors = error.response?.data.errors ?? [];
        let firstInvalidField: string | null = null;

        fieldErrors.forEach((fieldError) => {
            if (!fieldError.property || !fieldError.message) {
                return;
            }

            if (!firstInvalidField) {
                firstInvalidField = fieldError.property;
            }

            form.setError(fieldError.property as keyof PersonalDetailsFormType, {
                type: "server",
                message: fieldError.message,
            });
        });

        if (!firstInvalidField) {
            return;
        }

        const selector = `[name="${firstInvalidField}"], #${firstInvalidField}`;
        const fieldElement = document.querySelector(selector);
        if (fieldElement instanceof HTMLElement) {
            fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
            fieldElement.focus();
        }
    };

    const {mutate: submitPersonalDetails, isPending} = useSubmitPersonalDetails({
        onSuccess: () => navigate("/application/registration-details", {replace: true}),
        onValidationError: handleValidationError,
    });

    const submit = (value: PersonalDetailsFormType) => {
        form.clearErrors();
        submitPersonalDetails(value);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(submit)}
                  className={"flex flex-col justify-between w-full h-full max-w-2xl space-y-4"}>
                <div>
                    <h2 className={"text-xl font-semibold"}>Provide Your Personal Details</h2>
                    <p className={"text-sm font-light text-[#7A7773]"}>Please enter your personal details</p>
                </div>
                <div className={"overflow-y-scroll pt-4 md:pt-10 px-1  flex-1 no-scrollbar"}>
                    <PersonalDetailsForm/>
                </div>
                <div className={"w-full flex items-center justify-between mt-8 lg:mt-0"}>
                    <Button
                        type={"button"}
                        size={"lg"}
                        onClick={() => navigate("/dashboard/home", { replace: true })}
                        className={"lg:hidden"}
                    >
                        Cancel
                    </Button>
                    <div className={"hidden lg:block"}/>
                    <Button type={"submit"} size={"lg"} disabled={isPending}>
                        {isPending ? <Spinner/> : "Continue"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
};

export default PersonalDetails;
