import {Button} from "~/components/ui/button";
import PersonalDetailsForm from "~/routes/application/personal-details/forms/personal-details-form";
import {useNavigate} from "react-router"
import {FormProvider} from "react-hook-form";
import {
    type PersonalDetailsFormType,
    useManagePersonalDetailsForm
} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import {useSubmitPersonalDetails} from "~/routes/application/personal-details/repository/useSubmitPersonalDetails";
import {useLogout} from "~/routes/auth/logout";
import {Spinner} from "~/components/ui/spinner";


const PersonalDetails = () => {
    const navigate = useNavigate();
    const {form, isLoading} = useManagePersonalDetailsForm();
    const logout = useLogout()

    const {mutate: submitPersonalDetails, isPending} = useSubmitPersonalDetails(
        () => navigate("/application/registration-details", {replace: true})
    );

    const submit = (value: PersonalDetailsFormType) => {
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
                    <Button type={"button"} size={"lg"} onClick={logout} className={"lg:hidden"}>Back to Login</Button>
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