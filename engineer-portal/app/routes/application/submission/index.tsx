import {Button} from "~/components/ui/button";
import {Link, useNavigate} from "react-router";
import {Field, FieldError} from "~/components/ui/field";
import {BirthDatePicker} from "~/components/custom/birth-date-picker";
import {Checkbox} from "~/components/ui/checkbox";
import {Controller} from "react-hook-form";
import { useManageDeclarationForm, type DeclarationFormType } from "./form/manage-declaration-form";
import { useSubmitDeclaration } from "./repository/useSubmitDeclaration";
import {Spinner} from "~/components/ui/spinner";


const Submission = () => {
    const navigate = useNavigate();
    const {handleSubmit, control, formState: {errors}} = useManageDeclarationForm();

    const mutation = useSubmitDeclaration(() =>
        navigate("/application/welcome", {replace: true})
    );

    const submit = (value: DeclarationFormType) => {
        mutation.mutate(value);
    };

    const handleSubmissionDeclaration = () => {
        handleSubmit(submit)();
    };

    return (
        <form className="flex flex-col justify-between w-full h-full max-w-2xl space-y-12">
            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold">Declaration & Submission</h2>
                </div>

                <div className="space-y-6 lg:pt-18">
                    <div className="border-3 border-[#F5F0F0] lg:border-white rounded-xl p-4">
                        <p className="text-neutral-500 text-sm">
                            I, the undersigned, agree that in the event of election as a Member of the Institution
                            of Engineers Tanzania (IET), I will abide by the Constitution and Bye-laws of the
                            Institution and will promote its objectives. I also certify that the information
                            provided is true and correct to the best of my knowledge.
                        </p>
                    </div>

                    <div
                        onSubmit={handleSubmit(submit)}
                        className="flex flex-col gap-4 lg:gap-8  lg:flex-row items-center justify-center p-4 rounded-xl bg-[#F5F0F0] lg:bg-white"
                    >
                        <Field className="max-w-md">
                            <span>Applicant Signature</span>
                            <Controller
                                name="declarationAgreed"
                                control={control}
                                render={({field}) => (
                                    <div className="text-sm flex items-center gap-2">
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                        <span>I agree to adhere to these precautions</span>
                                    </div>
                                )}
                            />
                            {errors.declarationAgreed && (
                                <FieldError>{errors.declarationAgreed.message}</FieldError>
                            )}
                        </Field>

                        <Field>
                            <Controller
                                name="declarationDate"
                                control={control}
                                render={({field}) => (
                                    <BirthDatePicker
                                        placeholder="MM-DD-YYYY"
                                        value={field.value ? new Date(field.value) : undefined}
                                        onChange={(date) => field.onChange(date?.toISOString())}
                                    />
                                )}
                            />
                            {errors.declarationDate && (
                                <FieldError>{errors.declarationDate.message}</FieldError>
                            )}
                        </Field>
                    </div>
                </div>
            </div>

            <div className="w-full flex items-center justify-between">
                <Link to="/application/references">
                    <Button size="lg">Back</Button>
                </Link>
                <div className="hidden lg:block"/>
                <Button type={"button"} size={"lg"} onClick={()=> handleSubmissionDeclaration()} disabled={mutation.isPending}>
                    {mutation.isPending ? <Spinner/> : "Complete Application"}
                </Button>
            </div>
        </form>
    );
};

export default Submission;

