import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Switch from "antd/lib/switch";
import { useMutation } from "@tanstack/react-query";
import { useUserStore } from "../../../../store/store";
import { toast } from "sonner";
import { userBasicInformationSave, } from "../../../../services/api";

const Step3Registration = ({ store, nextStep, prevStep }) => {
  const { loginResponce } = useUserStore();

  const [validationStatus, setValidationStatus] = useState({});

  // Validation patterns
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
      console.log(response, "response");

      if (response?.status) {
        toast.success(
          response?.message || "Basic Information Updated successfully!",
        );
        store.setRegistrationDetails(watchStep3());
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
    console.log(store, "store");

    const payload = {
      userId: loginResponce?.userId || 0,

      companyTypeId: store?.companyType || "",
      companyTypeName: store?.companyTypeName || "",
      companyName: store?.basicInfo?.companyName || "",
      email: store?.basicInfo?.email || "",
      contactNo: store?.basicInfo?.mobile || "",
      address: store?.basicInfo?.address || "",
      pinCode: store?.basicInfo?.pinCode || "",
      aadharNo: data?.aadharNo || "",
      gstNo: data?.gstNo || "",
      panNo: data?.panNo || "",
      esiNo: data?.esiNo || "",
      cinNo: data?.cinNo || "",
      isMSME: data?.udyogAadhaarToggle ? 1 : 0,
      udyogRegistrationNo: data?.msmeNo || "",
      pfNo: data?.pfNo || "",
      licenseNo: data?.licenseNo,
      licenseExpiryDate: data?.licenseExpiryDate,
    };
    console.log(payload, "payload");

    UpdateBasicInfo(payload);
  };

  const validateField = (fieldName, value) => {
    if (!value) return null;

    const pattern = patterns[fieldName];
    if (pattern && !pattern.test(value)) {
      return `Invalid ${fieldName.toUpperCase()} format`;
    }
    return null;
  };

  const handleFieldBlur = (fieldName, value) => {
    const error = validateField(fieldName, value);
    setValidationStatus((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  return (
    <form onSubmit={handleSubmitStep3(onUpdateStep3)} className="space-y-6 profileWizardStep">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pw-section-panel space-y-4"
      >
        <h4 className="text-xs uppercase font-extrabold tracking-widest text-blue-700 mb-4">
          Statutory registration numbers
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GST Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              GST Number
              {validationStatus.gstNo && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. 07AAAAA1111A1Z1"
              maxLength="15"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.gstNo
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("gstNo")}
              onBlur={(e) =>
                handleFieldBlur("gstNo", e.target.value.toUpperCase())
              }
            />
            {validationStatus.gstNo && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationStatus.gstNo}
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
              {validationStatus.pan && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. ABCDE1234F"
              maxLength="10"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.pan
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("panNo")}
              onBlur={(e) =>
                handleFieldBlur("pan", e.target.value.toUpperCase())
              }
            />
            {validationStatus.pan && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationStatus.pan}
              </span>
            )}
          </div>

          {/* CIN Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              CIN Number (Corporate)
              {validationStatus.cin && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. L27020MH1919PLC000540"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.cin
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("cinNo")}
              onBlur={(e) =>
                handleFieldBlur("cin", e.target.value.toUpperCase())
              }
            />
            {validationStatus.cin && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationStatus.cin}
              </span>
            )}
          </div>

          {/* Aadhaar Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              Aadhaar Number
              {validationStatus.aadhaar && (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789012"
              maxLength="12"
              className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.aadhaar
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              {...registerStep3("aadharNo")}
              onBlur={(e) => handleFieldBlur("aadhaar", e.target.value)}
            />
            {validationStatus.aadhaar && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationStatus.aadhaar}
              </span>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-100/50 border border-blue-200 rounded-lg text-[10px] text-blue-800">
          ℹ️ At least one identification number (GST/PAN/CIN/Aadhaar) is
          required
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="pw-section-panel space-y-4"
      >
        <h4 className="text-xs uppercase font-extrabold tracking-widest text-purple-700 mb-4">
          Employee & labor compliance
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
        <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl">
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
                  <span className="text-[9px] text-slate-500">
                    ℹ️ Visit https://udyamregistration.gov.in to register
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Form Actions */}
      <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-8">
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
