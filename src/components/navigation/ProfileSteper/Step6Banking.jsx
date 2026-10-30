import { Check, ChevronLeft, Loader } from "lucide-react";
import { useUserStore } from "../../../../store/store";
import { userBankDetailSave } from "../../../../services/api";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const Step6Banking = ({
  store,
  nextStep,
  prevStep,
  navigation,
  progress,
}) => {
  const getBankLogo = (ifsc) => {
    const code = ifsc?.substring(0, 4).toUpperCase();
    if (code === "SBIN")
      return {
        name: "State Bank of India",
        color: "from-blue-600 to-sky-500",
        text: "SBI",
      };
    if (code === "HDFC")
      return {
        name: "HDFC Bank",
        color: "from-blue-900 to-indigo-700",
        text: "HDFC",
      };
    if (code === "ICIC")
      return {
        name: "ICICI Bank",
        color: "from-orange-600 to-amber-500",
        text: "ICICI",
      };
    if (code === "UTIB")
      return {
        name: "Axis Bank",
        color: "from-rose-900 to-pink-700",
        text: "AXIS",
      };
    if (code === "PUNB")
      return {
        name: "Punjab National Bank",
        color: "from-red-700 to-orange-600",
        text: "PNB",
      };
    return {
      name: "Commercial Bank",
      color: "from-slate-800 to-slate-700",
      text: "BANK",
    };
  };
  const { loginResponce } = useUserStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ defaultValues: store.bankingDetails });

  // Mutation for saving bank details
  const { mutate: saveBankDetails, isPending: isSavingBank } = useMutation({
    mutationFn: userBankDetailSave,
    onSuccess: (response) => {
      if (response?.status) {
        toast.success(response?.message || "Banking Details saved successfully!");
        store.setBankingDetails(watch());
        nextStep();
      } else {
        toast.error(response?.message || "Failed to save banking details");
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to save banking details. Please try again.");
    },
  });

  const watchIfsc = watch("ifscCode") || "";
  const detectedBank = getBankLogo(watchIfsc);

  const onSaveStep6 = async (data) => {
    const payload = {
      // bankDetailID: 0,
      userId: loginResponce?.userId || 0,
      bankName: data.bankName || "",
      accountNo: data.accountNumber || "",
      ifsc: data.ifscCode || "",
      micr: data.micrCode || "",
      isPrimaryAccount: 1,

    };

    saveBankDetails(payload);
  };

  const handleFinish = () => {
    if (progress < 45) {
      toast.error(
        "You need at least 45% profile completion to save and finish."
      );
      return;
    }
    store.setIsSkipped(true);
    toast.success(
      "Congratulations! Your commercial profile is completed. Dashboard unlocked!"
    );
    navigation("/commercial/dashboard");
  };

  return (
    <form onSubmit={handleSubmit(onSaveStep6)} className="space-y-6 profileWizardStep">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">

            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Bank Name
            </label>
            <input
              type="text"
              placeholder="e.g. State Bank of India"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...register("bankName", {
                required: "Bank Name is required",
              })}
            />
            {errors.bankName && (
              <span className="text-red-500 text-[10px]">
                {errors.bankName.message}
              </span>
            )}

            <div className="flex flex-col gap-1.5 mt-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Account Number *
              </label>
              <input
                type="password"
                placeholder="Encrypted account number"
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 font-mono shadow-sm"
                {...register("accountNumber", {
                  required: "Account Number is required",
                  pattern: {
                    value: /^\d{9,18}$/,
                    message: "Must be between 9 and 18 digits",
                  },
                })}
              />
              {errors.accountNumber && (
                <span className="text-red-500 text-[10px]">
                  {errors.accountNumber.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                IFSC Code
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 font-mono uppercase shadow-sm"
                {...register("ifscCode", {
                  required: "IFSC is required",
                  pattern: {
                    value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                    message: "Invalid IFSC code format",
                  },
                })}
              />
              {errors.ifscCode && (
                <span className="text-red-500 text-[10px]">
                  {errors.ifscCode.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                MICR Code
              </label>
              <input
                type="text"
                placeholder="e.g. 110002001"
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 font-mono shadow-sm"
                {...register("micrCode")}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div
            data-bank-preview
            className={`w-80 h-48 rounded-3xl bg-gradient-to-br ${detectedBank.color} p-6 shadow-2xl flex flex-col justify-between text-white relative overflow-hidden border border-white/10 shadow-blue-500/5`}
          >
            <div className="absolute right-0 top-0 w-28 h-28 bg-white/5 rounded-full blur-xl translate-x-4 -translate-y-4" />
            <div className="absolute left-10 bottom-0 w-20 h-20 bg-black/10 rounded-full blur-lg" />

            <div className="flex justify-between items-start">
              <div>
                {/* <p className="text-[9px] uppercase font-bold tracking-widest text-white/70">
                  Contracts India Premium settlement
                </p> */}
                <h4 className="text-sm font-black mt-0.5">
                  {detectedBank.name}
                </h4>
              </div>
              <span className="text-xs font-black bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 tracking-widest font-mono">
                {detectedBank.text}
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                <span>••••</span> <span>••••</span> <span>••••</span>
                <span className="text-white font-bold ml-1">
                  {watch("accountNumber")
                    ? watch("accountNumber").slice(-4)
                    : "1234"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-3">
              <div>
                <p className="text-[8px] uppercase tracking-wider text-white/50">
                  Settlement Account
                </p>
                <p className="text-xs font-bold font-mono">
                  {watch("accountType") || "SAVINGS"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-wider text-white/50">
                  IFSC Routing
                </p>
                <p className="text-xs font-bold font-mono uppercase">
                  {watch("ifscCode") || "SBIN0000000"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-6">
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={isSavingBank}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
        >
          {isSavingBank ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              Save & Continue <Check className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
export default Step6Banking;