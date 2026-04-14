// registration-details.tsx (page)
import {Button} from "~/components/ui/button";
import {Link, useNavigate} from "react-router";
import RegistrationDetailsForm from "~/routes/application/registration-details/form/registration-details-form";
import {FormProvider} from 'react-hook-form';
import {
    useManageRegistrationDetailsForm,
    type RegistrationDetailsFormType
} from './form/manage-registration-details-form';
import {useSubmitRegistrationDetails} from "./repository/useSubmitRegistrationDetails";
import {Spinner} from "~/components/ui/spinner";

const RegistrationDetails = () => {
    const navigate = useNavigate();
    const {
        form: formOptions,
        institutionsFieldArray,
        saveAndAddInstitution,
        savedInstitutionCount,
        removeInstitution
    } = useManageRegistrationDetailsForm();

    const mutation = useSubmitRegistrationDetails(() =>
        navigate("/application/experience", {replace: true})
    );

    const submit = (value: RegistrationDetailsFormType) => {
        const payload = {
            ...value,
            institutions: value.institutions?.slice(0, savedInstitutionCount),
        };
        console.log(payload);
        mutation.mutate(payload);
    };

    return (
        <FormProvider {...formOptions}>
            <form
                onSubmit={formOptions.handleSubmit(submit)}
                className="flex flex-col justify-between w-full h-full max-w-2xl space-y-4"
            >
                <div>
                    <h2 className="text-xl font-semibold">Registration Details</h2>
                    <p className="text-sm font-light text-[#7A7773]">Provide your registration details</p>
                </div>
                <div className="overflow-y-scroll flex-1 pt-4 md:pt-10 no-scrollbar px-1">
                    <RegistrationDetailsForm
                        institutionsFieldArray={institutionsFieldArray}
                        savedInstitutionCount={savedInstitutionCount}
                        saveAndAddInstitution={saveAndAddInstitution}
                        removeInstitution={removeInstitution}
                    />
                </div>

                <div className="w-full flex items-center justify-between mt-8 lg:mt-0">
                    <Link to="/application/personal-details">
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

export default RegistrationDetails;