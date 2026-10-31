import { Switch } from "antd";
import {
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    BadgeCheck,
    Building2,
    Info,
    Loader,
    ShieldCheck,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: REGISTRATION & COMPLIANCE
// ═══════════════════════════════════════════════════════════════════════════════

export function Step3Registration({ store, nextStep, prevStep }) {
    const patterns = {
        gstNo: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        panNo: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
        cinNo: /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
        aadharNo: /^\d{12}$/,
    };
    const {
        register: registerStep3,
        control: controlStep3,
        handleSubmit: handleSubmitStep3,
        formState: { errors: errorsStep3 },
        setValue: setValueStep3,
        watch: watchStep3,
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            gstNo: store.registrationDetails?.gstNo || "",
            panNo: store.registrationDetails?.panNo || "",
            cinNo: store.registrationDetails?.cinNo || "",
            aadharNo: store.registrationDetails?.aadharNo || "",
            pfNo: store.registrationDetails?.pfNo || "",
            esiNo: store.registrationDetails?.esiNo || "",
            msmeNo: store.registrationDetails?.msmeNo || "",
            udyogAadhaarToggle: store.registrationDetails?.udyogAadhaarToggle || false,
            licenseNo: store.registrationDetails?.licenseNo || "",
            licenseExpiryDate: store.registrationDetails?.licenseExpiryDate || "",
        },
    });

    const onSaveStep3 = async (data) => {
        const identifiers = {
            gstNo: data.gstNo?.trim().toUpperCase() || "",
            panNo: data.panNo?.trim().toUpperCase() || "",
            cinNo: data.cinNo?.trim().toUpperCase() || "",
            aadharNo: data.aadharNo?.trim() || "",
        };
        if (!Object.values(identifiers).some(Boolean)) {
            toast.error("Add at least one business identification number.");
            return;
        }

        try {
            store.setRegistrationDetails({ ...data, ...identifiers });
            toast.success("Registration & Compliance details saved!");
            nextStep();
        } catch (error) {
            toast.error(error?.message || "Failed to save registration details");
        }
    };

    return (
        <form onSubmit={handleSubmitStep3(onSaveStep3)} className="space-y-6 profileWizardStep pw-step--registration pw-step--registration-extended">
            <div className="pw-step-intro">
                <span className="pw-step-intro__icon">
                    <Building2 aria-hidden="true" />
                </span>
                <div>
                    <h3>Registration & compliance</h3>
                    <p>Add the business identifiers and workforce details that apply to your organisation.</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SECTION A - Registration Details */}
                <div className="pw-section-panel pw-registration-section bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                    <h4 className="pw-section-heading">
                        <BadgeCheck aria-hidden="true" />
                        <span>
                            <strong>Business registration</strong>
                            <small>Tax and identity numbers for your organisation.</small>
                        </span>
                    </h4>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            GST Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 07AAAAA1111A1Z1"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("gstNo", {
                                validate: (value) => !value || patterns.gstNo.test(value.trim().toUpperCase()) || "Invalid GSTIN format",
                            })}
                        />
                        {errorsStep3.gstNo && (
                            <span className="text-red-500 text-[10px]">
                                {errorsStep3.gstNo.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            PAN Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("panNo", {
                                validate: (value) => !value || patterns.panNo.test(value.trim().toUpperCase()) || "Invalid PAN format",
                            })}
                        />
                        {errorsStep3.panNo && (
                            <span className="text-red-500 text-[10px]">
                                {errorsStep3.panNo.message}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            CIN Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. L27020MH1919PLC000540"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("cinNo", {
                                validate: (value) => !value || patterns.cinNo.test(value.trim().toUpperCase()) || "Invalid CIN format",
                            })}
                        />
                        {errorsStep3.cinNo && (
                            <span className="text-red-500 text-[10px]">{errorsStep3.cinNo.message}</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Aadhaar Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 123456789012"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("aadharNo", {
                                validate: (value) => !value || patterns.aadharNo.test(value.trim()) || "Aadhaar must be 12 digits",
                            })}
                        />
                        {errorsStep3.aadharNo && (
                            <span className="text-red-500 text-[10px]">
                                {errorsStep3.aadharNo.message}
                            </span>
                        )}
                    </div>
                </div>

                {/* SECTION B - Additional Compliance */}
                <div className="pw-section-panel pw-compliance-section bg-slate-50/50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
                    <h4 className="pw-section-heading">
                        <ShieldCheck aria-hidden="true" />
                        <span>
                            <strong>Additional compliance</strong>
                            <small>Employee, licence, and MSME details where applicable.</small>
                        </span>
                    </h4>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Provident Fund Account No.
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. MHBAN1234567000"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("pfNo")}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            ESI Number
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 31000123450001001"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("esiNo")}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Trade or shop licence number
                        </label>
                        <input
                            type="text"
                            placeholder="Licence number"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                            {...registerStep3("licenseNo")}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Licence expiry date
                        </label>
                        <input
                            type="date"
                            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 shadow-sm"
                            {...registerStep3("licenseExpiryDate")}
                        />
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2">
                        <span className="text-[11px] font-bold text-slate-600">
                            MSME (Y/N)
                        </span>
                        <Controller
                            control={controlStep3}
                            name="udyogAadhaarToggle"
                            defaultValue={false}
                            render={({ field }) => (
                                <Switch
                                    checked={field.value ?? false}
                                    onChange={(val) => {
                                        field.onChange(val);
                                        setValueStep3("udyogAadhaarToggle", val);
                                    }}
                                />
                            )}
                        />
                    </div>

                    {watchStep3("udyogAadhaarToggle") && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Udyog Aadhaar / Registration
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. UDYAM-MH-01-0012345"
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                                {...registerStep3("msmeNo")}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="pw-step-note">
                <Info aria-hidden="true" />
                <span>At least one identification number (GST, PAN, CIN, or Aadhaar) is required.</span>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-6 pw-step-actions">
                <button
                    type="button"
                    onClick={prevStep}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
                >
                    Save & Continue <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL HELPER EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format error message for display
 * @param {string} fieldName - Field name
 * @param {string} errorMessage - Error message
 * @returns {JSX} Formatted error element
 */
export const FormError = ({ fieldName, errorMessage }) => (
    <span className="pw-form-error text-red-500 text-[10px] flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> {errorMessage}
    </span>
);

/**
 * Input field wrapper component
 */
export const FormInput = ({
    label,
    error,
    required,
    placeholder,
    type = "text",
    ...props
}) => (
    <div className="flex flex-col gap-1.5 profileWizardField pw-form-field">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label} {required && "*"}
        </label>
        <input
            type={type}
            placeholder={placeholder}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
            {...props}
        />
        {error && <FormError fieldName={label} errorMessage={error.message} />}
    </div>
);

/**
 * Textarea field wrapper component
 */
export const FormTextarea = ({
    label,
    error,
    required,
    placeholder,
    rows = 3,
    ...props
}) => (
    <div className="flex flex-col gap-1.5 profileWizardField">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label} {required && "*"}
        </label>
        <textarea
            placeholder={placeholder}
            rows={rows}
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 resize-none shadow-sm"
            {...props}
        />
        {error && <FormError fieldName={label} errorMessage={error.message} />}
    </div>
);

/**
 * Submit button component
 */
export const FormSubmitButton = ({ isLoading, children, onClick }) => (
    <button
        type="submit"
        disabled={isLoading}
        onClick={onClick}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
    >
        {isLoading ? (
            <>
                <Loader className="w-4 h-4 animate-spin" /> Saving...
            </>
        ) : (
            <>
                {children} <ChevronRight className="w-4 h-4" />
            </>
        )}
    </button>
);

/**
 * Back button component
 */
export const FormBackButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
    >
        <ChevronLeft className="w-4 h-4" /> Back
    </button>
);

/**
 * Form actions footer
 */
export const FormActions = ({ onBack, onSubmit, isLoading, submitLabel = "Save & Continue" }) => (
    <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
        <FormBackButton onClick={onBack} />
        <FormSubmitButton isLoading={isLoading} onClick={onSubmit}>
            {submitLabel}
        </FormSubmitButton>
    </div>
);