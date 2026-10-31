import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldCheck,
} from "lucide-react";
import Switch from "antd/lib/switch";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../../../../store/store";
import { toast } from "sonner";
import { userBasicInformationSave, } from "../../../../services/api";

const Step3Registration = ({ store, nextStep, prevStep }) => {
  const { loginResponce } = useUserStore();

  const patterns = {
    gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    aadhaar: /^\d{12}$/,
    cin: /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
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

      udyogAadhaarToggle:
        store.registrationDetails?.udyogAadhaarToggle || false,
      licenseNo: store.registrationDetails?.licenseNo || "",
      licenseExpiryDate: store.registrationDetails?.licenseExpiryDate || "",
    },
  });
  const { mutate: UpdateBasicInfo, isPending: isSaving } = useMutation({
    mutationFn: userBasicInformationSave,
    onSuccess: (response) => {
      if (response?.status) {
        toast.success(
          response?.message || "Basic Information Updated successfully!",
        );
        const registration = watchStep3();
        store.setRegistrationDetails({
          ...registration,
          gstNo: registration.gstNo?.trim().toUpperCase() || "",
          panNo: registration.panNo?.trim().toUpperCase() || "",
          cinNo: registration.cinNo?.trim().toUpperCase() || "",
          aadharNo: registration.aadharNo?.trim() || "",
        });
        nextStep();
      } else {
        toast.error(response?.message || "Failed to Update basic information");
      }
    },
    onError: (error) => {
      toast.error(
        error?.message ||
        "Failed to Update basic information. Please try again.",
      );
    },
  });
  const onUpdateStep3 = async (data) => {
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

    const payload = {
      userId: loginResponce?.userId || 0,

      companyTypeId: store?.companyType || "",
      companyTypeName: store?.companyTypeName || "",
      companyName: store?.basicInfo?.companyName || "",
      email: store?.basicInfo?.email || "",
      contactNo: store?.basicInfo?.mobile || "",
      address: store?.basicInfo?.address || "",
      pinCode: store?.basicInfo?.pinCode || "",
      aadharNo: identifiers.aadharNo,
      gstNo: identifiers.gstNo,
      panNo: identifiers.panNo,
      esiNo: data?.esiNo || "",
      cinNo: identifiers.cinNo,
      isMSME: data?.udyogAadhaarToggle ? 1 : 0,
      udyogRegistrationNo: data?.msmeNo || "",
      pfNo: data?.pfNo || "",
      licenseNo: data?.licenseNo,
      licenseExpiryDate: data?.licenseExpiryDate,
    };
    UpdateBasicInfo(payload);
  };

  return (
    <form onSubmit={handleSubmitStep3(onUpdateStep3)} className="space-y-6 profileWizardStep pw-step--registration">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pw-section-panel space-y-4 pw-registration-section"
      >
        <h4 className="pw-section-heading">
          <BadgeCheck aria-hidden="true" />
          <span>
            <strong>Business registration</strong>
            <small>Tax and identity numbers for your organisation.</small>
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GST Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              GST Number
              {errorsStep3.gstNo && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. 07AAAAA1111A1Z1"
              maxLength="15"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${errorsStep3.gstNo
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("gstNo", {
                validate: (value) =>
                  !value || patterns.gstin.test(value.trim().toUpperCase()) ||
                  "Invalid GSTIN format",
              })}
            />
            {errorsStep3.gstNo && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorsStep3.gstNo.message}
              </span>
            )}
            {errorsStep3.gstNo && (
              <span className="text-red-500 text-[10px]">
                {errorsStep3.gstNo.message}
              </span>
            )}
          </div>

          {/* PAN Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              PAN Number
              {errorsStep3.panNo && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. ABCDE1234F"
              maxLength="10"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${errorsStep3.panNo
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("panNo", {
                validate: (value) =>
                  !value || patterns.pan.test(value.trim().toUpperCase()) ||
                  "Invalid PAN format",
              })}
            />
            {errorsStep3.panNo && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorsStep3.panNo.message}
              </span>
            )}
          </div>

          {/* CIN Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              CIN Number (Corporate)
              {errorsStep3.cinNo && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. L27020MH1919PLC000540"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${errorsStep3.cinNo
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("cinNo", {
                validate: (value) =>
                  !value || patterns.cin.test(value.trim().toUpperCase()) ||
                  "Invalid CIN format",
              })}
            />
            {errorsStep3.cinNo && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorsStep3.cinNo.message}
              </span>
            )}
          </div>

          {/* Aadhaar Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              Aadhaar Number
              {errorsStep3.aadharNo && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              maxLength="12"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${errorsStep3.aadharNo
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("aadharNo", {
                validate: (value) =>
                  !value || patterns.aadhaar.test(value.trim()) ||
                  "Aadhaar must be 12 digits",
              })}
            />
            {errorsStep3.aadharNo && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errorsStep3.aadharNo.message}
              </span>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="pw-step-note">
          <Info aria-hidden="true" />
          <span>
            At least one identification number (GST, PAN, CIN, or Aadhaar) is
            required.
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pw-section-panel space-y-4 pw-compliance-section"
      >
        <h4 className="pw-section-heading">
          <ShieldCheck aria-hidden="true" />
          <span>
            <strong>Additional compliance</strong>
            <small>Include employee, licence, and MSME details where applicable.</small>
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PF Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Provident Fund Account No.
            </label>
            <input
              type="text"
              placeholder="e.g. MHBAN1234567000"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...registerStep3("pfNo")}
            />
          </div>

          {/* ESI Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              ESI Number
            </label>
            <input
              type="text"
              placeholder="e.g. 31000123450001001"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...registerStep3("esiNo")}
            />
          </div>

          {/* License Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Trade/Shop License No.
            </label>
            <input
              type="text"
              placeholder="e.g. LIC123456"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...registerStep3("licenseNo")}
            />
          </div>

          {/* License Expiry */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              License Expiry Date
            </label>
            <input
              type="date"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 shadow-sm"
              {...registerStep3("licenseExpiryDate")}
            />
          </div>
        </div>

        {/* MSME Toggle */}
        <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl pw-msme-panel">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-800">
                Is this an MSME Enterprise?
              </span>
              <span className="text-[10px] text-slate-500">
                Micro, Small & Medium Enterprise Registration
              </span>
            </div>
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

          {/* MSME Number - Show if toggled */}
          <AnimatePresence>
            {watchStep3("udyogAadhaarToggle") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-slate-200"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Udyam Registration Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UDYAM-MH-01-0012345"
                    className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
                    {...registerStep3("msmeNo")}
                  />
                  <span className="pw-inline-note">
                    <Info aria-hidden="true" />
                    <span>
                      Visit{" "}
                      <a
                        href="https://udyamregistration.gov.in"
                        target="_blank"
                        rel="noreferrer"
                      >
                        udyamregistration.gov.in
                      </a>{" "}
                      to register.
                    </span>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Form Actions */}
      <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-8 pw-step-actions">
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
        >
          Update & Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
export default Step3Registration;
