import { message, Switch } from "antd";
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Upload,
  X,
  FileText,
  Loader,
  GripVertical,
  Layers3,
  EyeOff,
  Zap,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react"; 
import { AnimatePresence, motion } from "framer-motion"; 
import { toast } from "sonner"; 
import { SERVICES_HIERARCHY } from "../../../../data/services_hierarchy"; 
 
// export function Step3Registration({ store, nextStep, prevStep }) {
//   const {
//     register: registerStep3,
//     control: controlStep3,
//     handleSubmit: handleSubmitStep3,
//     formState: { errors: errorsStep3 },
//     setValue: setValueStep3,
//     watch: watchStep3,
//   } = useForm({
//     mode: "onBlur",
//     defaultValues: {
//       gstNo: store.registrationDetails?.gstNo || "",
//       panNo: store.registrationDetails?.panNo || "",
//       cinNo: store.registrationDetails?.cinNo || "",
//       aadharNo: store.registrationDetails?.aadharNo || "",
//       pfNo: store.registrationDetails?.pfNo || "",
//       esiNo: store.registrationDetails?.esiNo || "",
//       msmeNo: store.registrationDetails?.msmeNo || "",
//       udyogAadhaarToggle: store.registrationDetails?.udyogAadhaarToggle || false,
//       licenseNo: store.registrationDetails?.licenseNo || "",
//       licenseExpiryDate: store.registrationDetails?.licenseExpiryDate || "",
//     },
//   });

//   const [activeSection, setActiveSection] = useState("section-a");
//   const [validationStatus, setValidationStatus] = useState({});

//   // Validation patterns
//   const patterns = {
//     gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/,
//     pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
//     aadhaar: /^\d{12}$/,
//     cin: /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/,
//   };

//   const onSaveStep3 = async (data) => {
//     try {
//       // Validate at least one identifier is provided
//       const hasIdentifier = data.gstNo || data.panNo || data.cinNo || data.aadharNo;
//       if (!hasIdentifier) {
//         toast.error("Please provide at least one identifier (GST/PAN/CIN/Aadhaar)");
//         return;
//       }

//       // Save to store
//       store.setRegistrationDetails(data);
//       toast.success("✓ Registration & Compliance details saved successfully!");
//       nextStep();
//     } catch (error) {
//       toast.error("Failed to save registration details");
//     }
//   };

//   const validateField = (fieldName, value) => {
//     if (!value) return null;

//     const pattern = patterns[fieldName];
//     if (pattern && !pattern.test(value)) {
//       return `Invalid ${fieldName.toUpperCase()} format`;
//     }
//     return null;
//   };

//   const handleFieldBlur = (fieldName, value) => {
//     const error = validateField(fieldName, value);
//     setValidationStatus((prev) => ({
//       ...prev,
//       [fieldName]: error,
//     }));
//   };

//   const sections = [
//     {
//       id: "section-a",
//       title: "SECTION A – Registration Details",
//       icon: "📋",
//       color: "blue",
//     },
//     {
//       id: "section-b",
//       title: "SECTION B – Additional Compliance",
//       icon: "⚖️",
//       color: "purple",
//     },
//   ];

//   return (
//     <form onSubmit={handleSubmitStep3(onSaveStep3)} className="space-y-6">
//       {/* Tab Navigation */}
//       <div className="flex gap-2 border-b border-slate-200">
//         {sections.map((section) => (
//           <button
//             key={section.id}
//             type="button"
//             onClick={() => setActiveSection(section.id)}
//             className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeSection === section.id
//               ? `border-blue-600 text-blue-600`
//               : `border-transparent text-slate-600 hover:text-slate-800`
//               }`}
//           >
//             <span className="mr-2">{section.icon}</span>
//             {section.title}
//           </button>
//         ))}
//       </div>

//       {/* Section A - Registration Details */}
//       <AnimatePresence mode="wait">
//         {activeSection === "section-a" && (
//           <motion.div
//             key="section-a"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl p-6 space-y-4"
//           >
//             <h4 className="text-xs uppercase font-extrabold tracking-widest text-blue-700 mb-4">
//               📋 Statutory Registration Numbers
//             </h4>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* GST Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
//                   GST Number
//                   {validationStatus.gstNo && (
//                     <AlertCircle className="w-3 h-3 text-red-500" />
//                   )}
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. 07AAAAA1111A1Z1"
//                   maxLength="15"
//                   className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.gstNo
//                     ? "border-red-300 focus:border-red-400 focus:ring-red-100"
//                     : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
//                     }`}
//                   {...registerStep3("gstNo")}
//                   onBlur={(e) =>
//                     handleFieldBlur("gstNo", e.target.value.toUpperCase())
//                   }
//                 />
//                 {validationStatus.gstNo && (
//                   <span className="text-red-500 text-[10px] flex items-center gap-1">
//                     <AlertCircle className="w-3 h-3" />
//                     {validationStatus.gstNo}
//                   </span>
//                 )}
//                 {errorsStep3.gstNo && (
//                   <span className="text-red-500 text-[10px]">
//                     {errorsStep3.gstNo.message}
//                   </span>
//                 )}
//               </div>

//               {/* PAN Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
//                   PAN Number
//                   {validationStatus.pan && (
//                     <AlertCircle className="w-3 h-3 text-red-500" />
//                   )}
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. ABCDE1234F"
//                   maxLength="10"
//                   className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.pan
//                     ? "border-red-300 focus:border-red-400 focus:ring-red-100"
//                     : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
//                     }`}
//                   {...registerStep3("panNo")}
//                   onBlur={(e) =>
//                     handleFieldBlur("pan", e.target.value.toUpperCase())
//                   }
//                 />
//                 {validationStatus.pan && (
//                   <span className="text-red-500 text-[10px] flex items-center gap-1">
//                     <AlertCircle className="w-3 h-3" />
//                     {validationStatus.pan}
//                   </span>
//                 )}
//               </div>

//               {/* CIN Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
//                   CIN Number (Corporate)
//                   {validationStatus.cin && (
//                     <AlertCircle className="w-3 h-3 text-red-500" />
//                   )}
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. L27020MH1919PLC000540"
//                   className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.cin
//                     ? "border-red-300 focus:border-red-400 focus:ring-red-100"
//                     : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
//                     }`}
//                   {...registerStep3("cinNo")}
//                   onBlur={(e) =>
//                     handleFieldBlur("cin", e.target.value.toUpperCase())
//                   }
//                 />
//                 {validationStatus.cin && (
//                   <span className="text-red-500 text-[10px] flex items-center gap-1">
//                     <AlertCircle className="w-3 h-3" />
//                     {validationStatus.cin}
//                   </span>
//                 )}
//               </div>

//               {/* Aadhaar Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
//                   Aadhaar Number
//                   {validationStatus.aadhaar && (
//                     <AlertCircle className="w-3 h-3 text-red-500" />
//                   )}
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. 123456789012"
//                   maxLength="12"
//                   className={`bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 shadow-sm transition-all ${validationStatus.aadhaar
//                     ? "border-red-300 focus:border-red-400 focus:ring-red-100"
//                     : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
//                     }`}
//                   {...registerStep3("aadharNo")}
//                   onBlur={(e) =>
//                     handleFieldBlur("aadhaar", e.target.value)
//                   }
//                 />
//                 {validationStatus.aadhaar && (
//                   <span className="text-red-500 text-[10px] flex items-center gap-1">
//                     <AlertCircle className="w-3 h-3" />
//                     {validationStatus.aadhaar}
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Info Box */}
//             <div className="mt-4 p-3 bg-blue-100/50 border border-blue-200 rounded-lg text-[10px] text-blue-800">
//               ℹ️ At least one identification number (GST/PAN/CIN/Aadhaar) is required
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Section B - Additional Compliance */}
//       <AnimatePresence mode="wait">
//         {activeSection === "section-b" && (
//           <motion.div
//             key="section-b"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl p-6 space-y-4"
//           >
//             <h4 className="text-xs uppercase font-extrabold tracking-widest text-purple-700 mb-4">
//               ⚖️ Employee & Labor Compliance
//             </h4>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* PF Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                   Provident Fund Account No.
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. MHBAN1234567000"
//                   className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
//                   {...registerStep3("pfNo")}
//                 />
//               </div>

//               {/* ESI Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                   ESI Number
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. 31000123450001001"
//                   className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
//                   {...registerStep3("esiNo")}
//                 />
//               </div>

//               {/* License Number */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                   Trade/Shop License No.
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. LIC123456"
//                   className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
//                   {...registerStep3("licenseNo")}
//                 />
//               </div>

//               {/* License Expiry */}
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                   License Expiry Date
//                 </label>
//                 <input
//                   type="date"
//                   className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 shadow-sm"
//                   {...registerStep3("licenseExpiryDate")}
//                 />
//               </div>
//             </div>

//             {/* MSME Toggle */}
//             <div className="mt-6 p-4 bg-white border border-slate-200 rounded-xl">
//               <div className="flex items-center justify-between">
//                 <div className="flex flex-col gap-1">
//                   <span className="text-sm font-bold text-slate-800">
//                     Is this an MSME Enterprise?
//                   </span>
//                   <span className="text-[10px] text-slate-500">
//                     Micro, Small & Medium Enterprise Registration
//                   </span>
//                 </div>
//                 <Controller
//                   control={controlStep3}
//                   name="udyogAadhaarToggle"
//                   defaultValue={false}
//                   render={({ field }) => (
//                     <Switch
//                       checked={field.value ?? false}
//                       onChange={(val) => {
//                         field.onChange(val);
//                         setValueStep3("udyogAadhaarToggle", val);
//                       }}
//                     />
//                   )}
//                 />
//               </div>

//               {/* MSME Number - Show if toggled */}
//               {watchStep3("udyogAadhaarToggle") && (
//                 <motion.div
//                   initial={{ opacity: 0, height: 0 }}
//                   animate={{ opacity: 1, height: "auto" }}
//                   exit={{ opacity: 0, height: 0 }}
//                   className="mt-4 pt-4 border-t border-slate-200"
//                 >
//                   <div className="flex flex-col gap-1.5">
//                     <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
//                       Udyam Registration Number
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g. UDYAM-MH-01-0012345"
//                       className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
//                       {...registerStep3("msmeNo")}
//                     />
//                     <span className="text-[9px] text-slate-500">
//                       ℹ️ Visit https://udyamregistration.gov.in to register
//                     </span>
//                   </div>
//                 </motion.div>
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Form Actions */}
//       <div className="flex justify-between gap-3 pt-6 border-t border-slate-100 mt-8">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
//         >
//           <ChevronLeft className="w-4 h-4" /> Back
//         </button>
//         <button
//           type="submit"
//           className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
//         >
//           Save & Continue <ChevronRight className="w-4 h-4" />
//         </button>
//       </div>
//     </form>
//   );
// }

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 6: BANKING DETAILS
// ═══════════════════════════════════════════════════════════════════════════════
 
// export function Step5ServiceListing({ store, nextStep, prevStep }) {
//   const [services, setServices] = useState(SERVICES_HIERARCHY);

//   const colorMap = {
//     violet: { border: "#c4b5fd", bg: "#f5f3ff", text: "#7c3aed", glow: "rgba(124, 58, 237, 0.4)" },
//     cyan: { border: "#a5f3fc", bg: "#ecfeff", text: "#0891b2", glow: "rgba(8, 145, 178, 0.4)" },
//     amber: { border: "#fde68a", bg: "#fffbeb", text: "#d97706", glow: "rgba(217, 119, 6, 0.4)" },
//     rose: { border: "#fecdd3", bg: "#fff1f2", text: "#e11d48", glow: "rgba(225, 29, 72, 0.4)" },
//     emerald: { border: "#a7f3d0", bg: "#ecfdf5", text: "#059669", glow: "rgba(5, 150, 105, 0.4)" },
//   };
//   const [activeIds, setActiveIds] = useState(store?.activeServices || []);
//   const [expandedIds, setExpandedIds] = useState(store?.expandedServices || []);
//   const [draggedItem, setDraggedItem] = useState(null);
//   const [dragOverId, setDragOverId] = useState(null);

//   const toggleExpanded = (id) => {
//     setExpandedIds((prev) =>
//       prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
//     );
//   };

//   const toggleActive = (id) => {
//     setActiveIds((prev) => {
//       const isActive = prev.includes(id);
//       if (isActive) {
//         toast.success("Service deactivated");
//         return prev.filter((x) => x !== id);
//       }
//       toast.success("Service activated");
//       return [...prev, id];
//     });
//   };

//   const handleDragStart = (e, item) => {
//     setDraggedItem(item);
//     e.currentTarget.style.opacity = "0.5";
//   };

//   const handleDragEnd = (e) => {
//     e.currentTarget.style.opacity = "1";
//     setDraggedItem(null);
//     setDragOverId(null);
//   };

//   const handleDragOver = (e, targetId) => {
//     e.preventDefault();
//     setDragOverId(targetId);
//   };

//   const countTotalChildren = (item) => {
//     let count = 0;
//     const children = item?.subServices || item?.children || [];
//     children.forEach((child) => {
//       count++;
//       if (child.children || child.subServices) {
//         count += countTotalChildren(child);
//       }
//     });
//     return count;
//   };

//   const renderServiceItem = (item, level = 0, parentColor = "violet") => {
//     const isExpanded = expandedIds.includes(item?.id);
//     const isActive = activeIds.includes(item?.id);
//     const hasChildren = (item?.subServices || item?.children)?.length > 0;
//     const children = item?.subServices || item?.children || [];
//     const color = item?.color || parentColor;
//     const colors = colorMap[color];
//     const isDraggedOver = dragOverId === item?.id;

//     return (
//       <div key={item?.id} className="relative">
//         {/* Connecting line */}
//         {level > 0 && (
//           <div
//             className="absolute left-0 top-0 h-full w-[2px] -translate-x-6 opacity-30"
//             style={{
//               background: `linear-gradient(to bottom, ${colors.border}, transparent)`,
//             }}
//           />
//         )}

//         {/* Service Card */}
//         <motion.div
//           draggable
//           onDragStart={(e) => handleDragStart(e, item)}
//           onDragEnd={handleDragEnd}
//           onDragOver={(e) => handleDragOver(e, item?.id)}
//           whileHover={{ scale: 1.01 }}
//           className={`
//             group relative mb-3 overflow-hidden rounded-2xl
//             border-2 transition-all duration-300
//             cursor-move
//             ${isDraggedOver ? "scale-[1.02] ring-4 ring-offset-2" : ""}
//             ${isActive ? "bg-white" : "bg-slate-50/50"}
//           `}
//           style={{
//             borderColor: isDraggedOver ? colors.border : (isActive ? colors.border : "#e5e7eb"),
//             marginLeft: `${level * 40}px`,
//             boxShadow: isActive
//               ? `0 0 30px ${colors.glow}, 0 10px 40px -12px rgba(0,0,0,0.15)`
//               : "0 4px 12px rgba(0,0,0,0.05)",
//           }}
//         >
//           {/* Main content */}
//           <div className="relative p-4">
//             <div className="flex items-start gap-3">
//               {/* Drag handle */}
//               <GripVertical className="mt-1 h-5 w-5 flex-shrink-0 cursor-grab text-slate-300 transition-colors group-hover:text-slate-500" />

//               {/* Expand/Collapse button */}
//               {hasChildren && (
//                 <button
//                   onClick={() => toggleExpanded(item?.id)}
//                   className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border-2 transition-all"
//                   style={{
//                     borderColor: colors.border,
//                     backgroundColor: isExpanded ? "rgb(241 245 250)" : "white",
//                   }}
//                 >
//                   {isExpanded ? (
//                     <ChevronDown className="h-3.5 w-3.5" style={{ color: colors.text }} />
//                   ) : (
//                     <ChevronRight className="h-3.5 w-3.5" style={{ color: colors.text }} />
//                   )}
//                 </button>
//               )}

//               {/* Icon & Content */}
//               <div className="flex-1">
//                 <div className="flex items-start justify-between gap-4">
//                   <div className="flex items-start gap-3">
//                     {/* Service Icon */}
//                     {level === 0 && item?.icon && (
//                       <div
//                         className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
//                         style={{ backgroundColor: colors.bg }}
//                       >
//                         {item?.icon}
//                       </div>
//                     )}

//                     {/* Name & Details */}
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <h4 className={`font-bold ${level === 0 ? "text-base" : "text-sm"} text-slate-800`}>
//                           {item?.name}
//                         </h4>

//                         {/* Level badge */}
//                         <span
//                           className="rounded-full px-2 py-0.5 text-[10px] font-bold"
//                           style={{
//                             backgroundColor: colors.bg,
//                             color: colors.text,
//                           }}
//                         >
//                           L{level}
//                         </span>
//                       </div>

//                       {/* Meta info */}
//                       {hasChildren && (
//                         <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
//                           <span className="flex items-center gap-1">
//                             <Layers3 className="h-3 w-3" />
//                             {children?.length} items
//                           </span>

//                           {level === 0 && (
//                             <span className="text-[10px]">
//                               {countTotalChildren(item)} nested items
//                             </span>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Active toggle */}
//                   <button
//                     onClick={() => toggleActive(item?.id)}
//                     className={`
//                       flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 flex-shrink-0
//                       text-xs font-bold transition-all
//                       ${isActive ? "shadow-lg hover:shadow-xl" : "hover:scale-105"}
//                     `}
//                     style={{
//                       borderColor: isActive ? colors.border : "#e5e7eb",
//                       backgroundColor: isActive ? colors.bg : "white",
//                       color: isActive ? colors.text : "#64748b",
//                       boxShadow: isActive ? `0 0 20px ${colors.glow}` : undefined,
//                     }}
//                   >
//                     {isActive ? (
//                       <>
//                         <Zap className="h-3 w-3" />
//                         Active
//                       </>
//                     ) : (
//                       <>
//                         <EyeOff className="h-3 w-3 opacity-50" />
//                         Inactive
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Active indicator glow */}
//           {isActive && (
//             <div
//               className="absolute bottom-0 left-0 right-0 h-[3px]"
//               style={{
//                 background: `linear-gradient(to right, ${colors.glow}, ${colors.text}, ${colors.glow})`,
//                 boxShadow: `0 0 10px ${colors.glow}`,
//               }}
//             />
//           )}
//         </motion.div>

//         {/* Render children recursively */}
//         {isExpanded && hasChildren && (
//           <div className="relative ml-6 mt-2 space-y-2 border-l-2 border-dashed border-slate-200 pl-4">
//             {children.map((child) => renderServiceItem(child, level + 1, color))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const handleSave = () => {
//     store.setActiveServices(activeIds);
//     store.setExpandedServices(expandedIds);
//     toast.success(`✓ ${activeIds.length} services activated!`);
//     nextStep();
//   };

//   const totalActive = activeIds.length;
//   const totalServices = services.reduce((acc, s) => acc + 1 + countTotalChildren(s), 0);

//   return (
//     <div className="space-y-6">
//       {/* Header Stats */}
//       <div className="flex flex-wrap gap-3">
//         <div className="rounded-xl bg-emerald-50 px-4 py-2 border-2 border-emerald-200">
//           <div className="text-xs font-medium text-emerald-600">Active Services</div>
//           <div className="text-2xl font-black text-emerald-700">{totalActive}</div>
//         </div>
//         <div className="rounded-xl bg-violet-50 px-4 py-2 border-2 border-violet-200">
//           <div className="text-xs font-medium text-violet-600">Total Services</div>
//           <div className="text-2xl font-black text-violet-700">{totalServices}</div>
//         </div>
//         <div className="rounded-xl bg-cyan-50 px-4 py-2 border-2 border-cyan-200">
//           <div className="text-xs font-medium text-cyan-600">Expanded</div>
//           <div className="text-2xl font-black text-cyan-700">{expandedIds.length}</div>
//         </div>
//       </div>

//       {/* Info */}
//       <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
//         <GripVertical className="h-4 w-4" />
//         <span className="font-medium">
//           Drag any service to reorder • Click chevron to expand/collapse • Click status badge to toggle
//         </span>
//       </div>

//       {/* Service Tree */}
//       <div className="bg-white/80 backdrop-blur-xl border border-white/90 shadow-lg rounded-3xl p-6">
//         <div className="space-y-4">
//           {services.map((service) => renderServiceItem(service))}
//         </div>
//       </div>

//       {/* Form Actions */}
//       <div className="flex justify-between gap-3 pt-6 border-t border-slate-100">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
//         >
//           <ChevronLeft className="w-4 h-4" /> Back
//         </button>
//         <button
//           onClick={handleSave}
//           className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
//         >
//           Save & Continue <ChevronRight className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }
