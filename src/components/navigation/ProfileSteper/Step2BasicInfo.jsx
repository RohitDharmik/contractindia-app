import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Loader, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useUserStore } from "../../../../store/store";
import {
  userBasicInformationSave,
  userBasicInformationUpdate,
} from "../../../../services/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const Step2BasicInfo = ({ store, nextStep, prevStep, triggerOtpSend }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({ defaultValues: store.basicInfo });

  useEffect(() => {
    reset(store.basicInfo);
    setCompanyPhotos(store.basicInfo.companyPhotos || []);
  }, [store.basicInfo, reset]);

  const [companyPhotos, setCompanyPhotos] = useState(
    store.basicInfo.companyPhotos || [],
  );

  // Pincode related states
  const [pincodeData, setPincodeData] = useState([]);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { loginResponce } = useUserStore();

  // Mutation for saving basic info
  const { mutate: saveBasicInfo, isPending: isSaving } = useMutation({
    mutationFn: userBasicInformationSave,
    onSuccess: (response) => {
      console.log(response, "response");

      if (response?.status) {
        toast.success(
          response?.message || "Basic Information saved successfully!",
        );
        store.setBasicInfo(watch());
        nextStep();
      } else {
        toast.error(response?.message || "Failed to save basic information");
      }
    },
    onError: (error) => {
      toast.error(
        error?.message || "Failed to save basic information. Please try again.",
      );
    },
  });

  // Fetch pincode data
  const fetchPincodeData = async (pincode) => {
    if (pincode.length !== 6) return;

    setLoadingPincode(true);
    try {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      if (response.data[0].Status === "Success") {
        setPincodeData(response.data[0].PostOffice);
        setSelectedLocation(null);
        // Reset location fields
        setValue("locationName", "");
        setValue("district", "");
        setValue("state", "");
        setValue("country", "");
      } else {
        toast.error("Invalid pincode or no data found");
        setPincodeData([]);
      }
    } catch (error) {
      toast.error("Failed to fetch pincode data");
      setPincodeData([]);
    } finally {
      setLoadingPincode(false);
    }
  };

  // Handle pincode input change
  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("pinCode", value);

    if (value.length === 6) {
      fetchPincodeData(value);
    } else {
      setPincodeData([]);
      setSelectedLocation(null);
    }
  };

  // Handle location selection
  const handleLocationSelect = (e) => {
    const selectedName = e.target.value;
    const location = pincodeData.find((item) => item.Name === selectedName);

    if (location) {
      setSelectedLocation(location);
      setValue("locationName", location.Name);
      setValue("district", location.District);
      setValue("state", location.State);
      setValue("country", location.Country);
    }
  };

  const onSaveStep2 = async (data) => {
    store.setBasicInfo({ ...data, companyPhotos });

    const payload = {
      userId: loginResponce?.userId || 0,
      companyTypeId: store?.companyType || "",
      companyTypeName: store?.companyTypeName || "",
      companyName: data?.companyName || "",
      email: data?.email || "",
      contactNo: data?.mobile || "",
      address: data?.address || "",
      pinCode: data?.pinCode || "",
      locationName: data?.locationName || "",
      district: data?.district || "",
      state: data?.state || "",
      country: data?.country || "",
      gstNo: data?.gstNo || "",
      panNo: data?.panNo || "",
      esiNo: data?.esiNo || "",
      cinNo: data?.cinNo || "",
      isMSME: data?.udyogAadhaarToggle ? 1 : 0,
      udyogRegistrationNo: data?.msmeNo || "",
    };
    saveBasicInfo(payload);
  };

  const handlePhotoFiles = async (files) => {
    const readers = Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              name: file.name,
              size: file.size,
              type: file.type,
              src: reader.result,
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    );

    const previews = await Promise.all(readers);
    setCompanyPhotos((current) => [...current, ...previews]);
  };

  const handlePhotoInput = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    await handlePhotoFiles(files);
    event.target.value = "";
  };

  const removePhoto = (index) => {
    setCompanyPhotos((current) => current.filter((_, idx) => idx !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSaveStep2)} className="space-y-4 profileWizardStep">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Company Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Constructions Ltd"
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
            {...register("companyName", {
              required: "Company Name is required",
            })}
          />
          {errors.companyName && (
            <span className="text-red-500 text-[10px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.companyName.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Company Type *
          </label>
          <input
            type="text"
            placeholder="e.g. Private Limited"
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
            value={store.companyTypeName || ""}
            disabled
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Contact Person *
          </label>
          <input
            type="text"
            placeholder="e.g. Ramesh Dev"
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
            {...register("contactPerson", {
              required: "Contact Person is required",
            })}
          />
          {errors.contactPerson && (
            <span className="text-red-500 text-[10px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.contactPerson.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5 relative">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Email Address *
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="e.g. contact@acme.com"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
              })}
            />
          </div>
          {errors.email && (
            <span className="text-red-500 text-[10px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Mobile Number *
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
              {...register("mobile", {
                required: "Mobile is required",
                pattern: {
                  value: /^[0-9+\-\s]{10,16}$/,
                  message: "Invalid mobile number",
                },
              })}
            />
          </div>
          {errors.mobile && (
            <span className="text-red-500 text-[10px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.mobile.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Update Password{" "}
            <span className="text-[9px] font-medium text-slate-400">
              (optional)
            </span>
          </label>
          <input
            type="password"
            placeholder="Leave blank to keep current"
            className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 shadow-sm"
            {...register("password", {
              validate: (value) =>
                !value ||
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
                  value,
                ) ||
                "Password must be at least 8 chars",
            })}
          />
          {errors.password && (
            <span className="text-red-500 text-[10px] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.password.message}
            </span>
          )}
        </div>
      </div>

      <div className="pw-section-panel space-y-4 mt-6">
        <h4 className="text-xs uppercase font-extrabold tracking-widest text-green-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pincode Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Pin Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter 6-digit pincode"
                maxLength="6"
                value={watch("pinCode") || ""}
                onChange={handlePincodeChange}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100/50 text-slate-800 placeholder-slate-400 shadow-sm w-full"
              />
              {loadingPincode && (
                <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3.5 text-green-500" />
              )}
            </div>
            {errors.pinCode && (
              <span className="text-red-500 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.pinCode.message}
              </span>
            )}
          </div>

          {/* Location/Post Office Selection */}
          {pincodeData.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Select Location <span className="text-red-500">*</span>
              </label>
              <select
                value={watch("locationName") || ""}
                onChange={handleLocationSelect}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100/50 text-slate-800 shadow-sm"
              >
                <option value="">Select Post Office/Location</option>
                {pincodeData.map((location, index) => (
                  <option key={index} value={location.Name}>
                    {location.Name} - {location.BranchType}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Show location details after selection */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white border border-green-200 rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* District */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    District
                  </label>
                  <input
                    type="text"
                    value={watch("district") || ""}
                    disabled
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>

                {/* State */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    State
                  </label>
                  <input
                    type="text"
                    value={watch("state") || ""}
                    disabled
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Country
                  </label>
                  <input
                    type="text"
                    value={watch("country") || ""}
                    disabled
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Additional Info */}
              {/* <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="font-bold text-slate-600">Branch Type:</span>{" "}
                    <span className="text-slate-700">{selectedLocation.BranchType}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">Delivery Status:</span>{" "}
                    <span className="text-slate-700">{selectedLocation.DeliveryStatus}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">Division:</span>{" "}
                    <span className="text-slate-700">{selectedLocation.Division}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-600">Region:</span>{" "}
                    <span className="text-slate-700">{selectedLocation.Region}</span>
                  </div>
                </div>
              </div> */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Address Field */}
      <div className="flex flex-col gap-1.5 relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Address *
        </label>
        <textarea
          placeholder="Registered company address"
          rows={2}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 text-slate-800 placeholder-slate-400 resize-none shadow-sm"
          {...register("address", { required: "Address is required" })}
        />
        {errors.address && (
          <span className="text-red-500 text-[10px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.address.message}
          </span>
        )}
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
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              Save & Continue <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default Step2BasicInfo;