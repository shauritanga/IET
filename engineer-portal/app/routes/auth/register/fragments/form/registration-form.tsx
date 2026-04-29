import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { createOtpSession } from "~/utils/otp-session";
import { registerUser } from "~/routes/auth/register/requests/register-user";
import {
    normalizePhoneNumber,
    type RegistrationFormType,
    type RegistrationFormValues,
    useManageRegistrationForm,
} from "~/routes/auth/register/fragments/form/manage-registration-form";
import type { APIValidationError, TErrorMessage } from "~/types";

const EyeIcon = ({ open }: { open: boolean }) => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        {open
            ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
        }
    </svg>
)

function getStrength(password: string): { width: string; color: string; label: string } {
    if (!password) return { width: "0%", color: "transparent", label: "" }
    if (password.length < 6) return { width: "25%", color: "#E20C0A", label: "Weak" }
    if (password.length < 8) return { width: "50%", color: "#F57F17", label: "Fair" }
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { width: "100%", color: "#1a6b3c", label: "Strong" }
    return { width: "75%", color: "#2196F3", label: "Good" }
}

function focusField(fieldName: keyof RegistrationFormValues) {
    const selector = `[name="${fieldName}"], #${fieldName}`;
    const fieldElement = document.querySelector(selector);
    if (fieldElement instanceof HTMLElement) {
        fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
        fieldElement.focus();
    }
}

const RegistrationForm = () => {
    const { form } = useManageRegistrationForm();
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [apiError, setApiError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()
    const password = form.watch("password") ?? "";
    const strength = getStrength(password)

    const handleServerError = (error: TErrorMessage) => {
        const fieldErrors = error.response?.data.errors ?? [];
        let firstInvalidField: keyof RegistrationFormValues | null = null;

        fieldErrors.forEach((fieldError: APIValidationError) => {
            if (!fieldError.property || !fieldError.message) {
                return;
            }

            const fieldName = fieldError.property as keyof RegistrationFormValues;
            form.setError(fieldName, {
                type: "server",
                message: fieldError.message,
            });

            if (!firstInvalidField) {
                firstInvalidField = fieldName;
            }
        });

        if (firstInvalidField) {
            focusField(firstInvalidField);
            setApiError("Please fix the highlighted fields and try again.");
            return;
        }

        setApiError(error.response?.data.message ?? "Registration failed.");
    };

    const handleSubmit = async (values: RegistrationFormValues) => {
        form.clearErrors();
        setApiError("");
        setIsSubmitting(true);

        try {
            const payload: RegistrationFormType = {
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.trim(),
                phoneNumber: normalizePhoneNumber(values.phoneNumber),
                password: values.password,
                confirmPassword: values.confirmPassword,
            };

            await registerUser(payload);

            createOtpSession({
                flow: "email-verification",
                email: values.email,
                name: `${values.firstName} ${values.lastName}`.trim(),
            });

            navigate("/auth/verify-otp", { replace: true });
        } catch (error) {
            handleServerError(error as TErrorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-left-inner auth-register">
            <div className="auth-logo-block">
                <div className="auth-logo-img-big"><img src="/IET-logo.png" alt="IET Tanzania" /></div>
                <div className="auth-logo-org">Institution of Engineers<br />Tanzania</div>
            </div>

            <div className="auth-h">Create Account</div>
            <div className="auth-sub">Register for your IET Tanzania engineer portal account.</div>

            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className="auth-grid-2">
                    <div className="auth-group">
                        <label className="auth-lbl">First Name</label>
                        <input
                            id="firstName"
                            className="auth-inp"
                            placeholder="Joram"
                            {...form.register("firstName")}
                        />
                        <div className="auth-err">{form.formState.errors.firstName?.message ?? ""}</div>
                    </div>
                    <div className="auth-group">
                        <label className="auth-lbl">Last Name</label>
                        <input
                            id="lastName"
                            className="auth-inp"
                            placeholder="Jackson"
                            {...form.register("lastName")}
                        />
                        <div className="auth-err">{form.formState.errors.lastName?.message ?? ""}</div>
                    </div>
                </div>

                <div className="auth-group">
                    <label className="auth-lbl">Email Address</label>
                    <input
                        id="email"
                        className="auth-inp"
                        type="email"
                        placeholder="example@gmail.com"
                        {...form.register("email")}
                    />
                    <div className="auth-err">{form.formState.errors.email?.message ?? ""}</div>
                </div>

                <div className="auth-group">
                    <label className="auth-lbl">Phone Number</label>
                    <input
                        id="phoneNumber"
                        className="auth-inp"
                        placeholder="+255 7XX XXX XXX"
                        {...form.register("phoneNumber")}
                    />
                    <div className="auth-err">{form.formState.errors.phoneNumber?.message ?? ""}</div>
                </div>

                <div className="auth-grid-2">
                    <div className="auth-group">
                        <label className="auth-lbl">Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                className="auth-inp"
                                style={{ paddingRight: 40 }}
                                type={showPassword ? "text" : "password"}
                                placeholder="Min 8 characters"
                                {...form.register("password")}
                            />
                            <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--iet-muted)", background: "transparent", border: "none", padding: 0 }}>
                                <EyeIcon open={showPassword} />
                            </button>
                        </div>
                        <div className="auth-err">{form.formState.errors.password?.message ?? ""}</div>
                    </div>
                    <div className="auth-group">
                        <label className="auth-lbl">Confirm Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                className="auth-inp"
                                style={{ paddingRight: 40 }}
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat password"
                                {...form.register("confirmPassword")}
                            />
                            <button type="button" onClick={() => setShowConfirm((value) => !value)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--iet-muted)", background: "transparent", border: "none", padding: 0 }}>
                                <EyeIcon open={showConfirm} />
                            </button>
                        </div>
                        <div className="auth-err">{form.formState.errors.confirmPassword?.message ?? ""}</div>
                    </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 4, background: "var(--iet-border)", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: strength.width, borderRadius: 20, transition: "width .3s,background .3s", background: strength.color }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--iet-muted)", marginTop: 3 }}>{strength.label}</div>
                </div>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--iet-muted)", cursor: "pointer", marginBottom: 10 }}>
                    <input
                        type="checkbox"
                        style={{ marginTop: 2, accentColor: "var(--iet-red-dark)", width: 14, height: 14, flexShrink: 0 }}
                        {...form.register("acceptTerms")}
                    />
                    I agree to the <span style={{ color: "var(--iet-red)", fontWeight: 700 }}>&nbsp;IET Tanzania Terms &amp; Privacy Policy</span>
                </label>
                <div className="auth-err">{form.formState.errors.acceptTerms?.message ?? ""}</div>

                {apiError ? <div className="auth-err">{apiError}</div> : null}

                <button className="auth-btn-main" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
            </form>

            <div className="auth-switch">Already have an account? <Link to="/auth/login">Sign in</Link></div>
            <div className="auth-footer">&#169; 2025 Institute of Engineers Tanzania</div>
        </div>
    )
}

export default RegistrationForm
