import { Building2, Check, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { userCommonlistType } from "../../../../services/api";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
const userCommonlistTypeApi = async () => {
  const response = await userCommonlistType("Organisation_type");
  console.log(response, "response");
  return response ?? [];
};
const Step1CompanyType = ({ store, nextStep }) => {
  const [companyTypes, setcompanyTypes] = useState([]);
  const { data: companyTypesData = [], isLoading: companyTypesDataLoading } =
    useQuery({
      queryKey: ["userCommonlistTypeApi"],
      queryFn: () => userCommonlistTypeApi(),
    });
  // const companyTypes = [
  //   { id: "proprietor", label: "Proprietor", desc: "Single owner business" },
  //   {
  //     id: "partnership",
  //     label: "Partnership",
  //     desc: "Joint commercial venture",
  //   },
  //   {
  //     id: "private_limited",
  //     label: "Private Limited",
  //     desc: "PvT Ltd corporate structure",
  //   },
  //   {
  //     id: "public_limited",
  //     label: "Public Limited",
  //     desc: "Publicly listed enterprise",
  //   },
  //   { id: "opc", label: "OPC", desc: "One Person Company" },
  //   { id: "llp", label: "LLP", desc: "Limited Liability Partnership" },
  // ];
  useEffect(() => {
    if (companyTypesData?.length > 0) {
      const data = companyTypesData.map((item) => ({
        id: item.value,
        label: item.label,
        desc: item.name,
      }));

      setcompanyTypes(data || []);
    } else {
      setcompanyTypes([]);
    }
  }, [companyTypesData]);

  return (
    <div className="space-y-4 profileWizardStep profileWizardStep--selection">
      <p className="text-xs text-slate-500">
        Select your organization structure. This will determine registration
        details and tax requirements.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {companyTypes?.map((type) => {
          const isSelected = store.companyType == type?.id;
          return (
            <motion.button
              key={type?.id}
              type="button"
              data-wizard-choice
              aria-pressed={isSelected}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                store.setCompanyType({
                  companyType: type?.id,
                  companyTypeName: type?.label,
                })
              }
              className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-28 transition-all relative overflow-hidden group ${
                isSelected
                  ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-200 shadow-md"
                  : "bg-white border-slate-200/80 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div
                  className={`p-2 rounded-lg border ${
                    isSelected
                      ? "bg-blue-50 border-blue-100 text-blue-600"
                      : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800">
                  {type?.label}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {type?.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-6 ">
        <button
          onClick={nextStep}
          disabled={!store.companyType}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
        >
          Save & Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default Step1CompanyType;
