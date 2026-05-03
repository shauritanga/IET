import {Button} from "~/components/ui/button";
import {Link} from "react-router"
import {Field, FieldLabel} from "~/components/ui/field";
import {Input} from "~/components/ui/input";

const VerifyEmail = () => {
    return (
        <section className={"flex flex-col justify-between w-full h-full max-w-2xl space-y-12"}>
            <div className={"space-y-4 flex-1"}>
                <div>
                    <h2 className={"text-xl font-semibold"}>Verify E-Mail</h2>
                    <p className={"text-sm text-[var(--iet-muted)]"}>We have sent a code to your email: </p>
                </div>

                <div>
                    <form className={"space-y-2"}>
                        <Field>
                            <FieldLabel htmlFor="verificationCode">Enter Verification Code</FieldLabel>
                            <Input id="verificationCode" type="text" placeholder="IET-"/>
                        </Field>
                        <p className={"text-sm"}>
                            Didn't get a code? Click to resend
                        </p>
                    </form>
                </div>
            </div>

            <div className={"w-full flex items-center justify-between"}>
                <Link to={"/application/references"}>
                <Button size={"sm"}>Back</Button>
                </Link>
                <div className={"hidden lg:block"}/>
                <Link to={"/application/submission"}>
                    <Button size={"sm"}>Continue</Button>
                </Link>
            </div>
        </section>
    );
};

export default VerifyEmail;
