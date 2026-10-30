import {
  ChevronLeft,
  ChevronRight,
  Loader,
  Upload,
  FileText,
  AlertCircle,
  X,
  Eye,
  Trash2,
  RefreshCw,
  Download,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUserStore } from "../../../../store/store";
import {
  DocumentCategoryGet,
  DocumentSubCategoryGet,
  UserDocumentStoreGetById,
  UserDocumentStoreSave,
  UserDocumentStoreUpdate,
  UserDocumentStoreDelete,
} from "../../../../services/api";


const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BASE_URL ||
  import.meta.env.BASE_URL;
// ─── API helpers ───────────────────────────────────────────────────────────────
const fetchUserDocuments = async (userId) => {
  const response = await UserDocumentStoreGetById(`userId=${userId}`);
  return response?.data ?? [];
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]); // strip data:...;base64,
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildDocPayload = async ({ file, userId, category, subCategory, existingDocId = 0 }) => {
  const base64 = await fileToBase64(file);
  const ext = file.name.split(".").pop().toLowerCase();
  const sizeKB = +(file.size / 1024).toFixed(2);
  const now = new Date().toISOString();

  return {
    userDocumentID: existingDocId,
    userID: userId,
    documentName: file.name,
    documentCategoryID: category.DocumentCategoryID,
    documentCategoryName: category.DocumentCategoryName,
    documentSubCategoryID: subCategory.DocumentSubCategoryID,
    documentSubCategoryName: subCategory.DocumentSubCategoryName,
    documentPath: "",
    fileExtension: ext,
    documentFileBase64: base64,
    documentFileBytes: "",
    fileSizeKB: sizeKB,

  };
};

// ─── Validate file ─────────────────────────────────────────────────────────────
function validateFile(file, maxMB = 5, formats = ["pdf", "jpg", "jpeg", "png", "tiff"]) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const size = file.size / (1024 * 1024);
  if (!ext || !formats.includes(ext))
    return { isValid: false, error: `Allowed formats: ${formats.join(", ")}` };
  if (size > maxMB)
    return { isValid: false, error: `Max size ${maxMB}MB. Your file: ${size.toFixed(2)}MB` };
  return { isValid: true };
}

// ─── Document Viewer Modal ─────────────────────────────────────────────────────
function DocumentViewer({ doc, onClose }) {
  const isPdf = doc?.fileExtension?.toLowerCase() === "pdf";
  const src = doc?.documentPath
    ? `${BASE_URL}/${doc.documentPath}`
    : doc?.documentFileBase64
      ? `data:${isPdf ? "application/pdf" : "image/jpeg"};base64,${doc.documentFileBase64}`
      : null;

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800 truncate max-w-xs">
                {doc.documentName}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                {doc.fileExtension}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={src}
                download={doc.documentName}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-slate-50">
            {isPdf ? (
              <iframe src={src} className="w-full h-[70vh]" title={doc.documentName} />
            ) : (
              <div className="flex items-center justify-center p-6 min-h-[60vh]">
                <img
                  src={src}
                  alt={doc.documentName}
                  className="max-w-full max-h-[65vh] rounded-xl object-contain shadow"
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Single Upload Card ────────────────────────────────────────────────────────
function UploadCard({ category, subCategory, userId, existingDoc, onRefresh }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewerDoc, setViewerDoc] = useState(null);

  const isUpdate = !!existingDoc;

  // ── Download helper ───────────────────────────────────────────────────────
  const handleDownload = () => {
    const url = `${BASE_URL}/UserDocumentStore/download?userId=${userId}&documentCategoryId=${category.DocumentCategoryID}&documentSubCategoryId=${subCategory.DocumentSubCategoryID}`;
    window.open(url, "_blank");
  };

  // ── Save mutation ─────────────────────────────────────────────────────────
  const { mutate: saveDoc } = useMutation({
    mutationFn: UserDocumentStoreSave,
    onSuccess: (res) => {
      if (res?.status) {
        toast.success("Document uploaded!");
        onRefresh();
      } else {
        toast.error(res?.message || "Upload failed");
      }
      setUploading(false);
      setProgress(0);
    },
    onError: (err) => {
      toast.error(err?.message || "Upload failed");
      setUploading(false);
      setProgress(0);
    },
  });

  // ── Update mutation ───────────────────────────────────────────────────────
  const { mutate: updateDoc } = useMutation({
    mutationFn: UserDocumentStoreUpdate,
    onSuccess: (res) => {
      if (res?.status) {
        toast.success("Document updated!");
        onRefresh();
      } else {
        toast.error(res?.message || "Update failed");
      }
      setUploading(false);
      setProgress(0);
    },
    onError: (err) => {
      toast.error(err?.message || "Update failed");
      setUploading(false);
      setProgress(0);
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────
  const { mutate: deleteDoc, isPending: isDeleting } = useMutation({
    mutationFn: (id) => UserDocumentStoreDelete(id),
    onSuccess: (res) => {
      if (res?.status) {
        toast.success("Document deleted.");
        onRefresh();
      } else {
        toast.error(res?.message || "Delete failed");
      }
    },
    onError: (err) => toast.error(err?.message || "Delete failed"),
  });

  // ── File processing ───────────────────────────────────────────────────────
  const processFile = async (file) => {
    const validation = validateFile(file);
    if (!validation.isValid) { toast.error(validation.error); return; }

    setUploading(true);
    setProgress(0);

    // Fake progress bar
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(p + 20, 90);
      setProgress(p);
    }, 150);

    try {
      const payload = await buildDocPayload({
        file,
        userId,
        category,
        subCategory,
        existingDocId: existingDoc?.UserDocumentID ?? 0,
      });
      clearInterval(iv);
      setProgress(100);

      if (isUpdate) {
        updateDoc({ ...payload, userDocumentID: existingDoc.UserDocumentID });
      } else {
        saveDoc(payload);
      }
    } catch {
      clearInterval(iv);
      toast.error("Failed to process file.");
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
      >
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              {subCategory?.DocumentSubCategoryName ?? "Unknown"}
            </h5>
            {existingDoc && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                ✓ Uploaded
              </span>
            )}
          </div>
        </div>

        {/* Uploaded doc actions */}
        {existingDoc ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-700 truncate">
                  {existingDoc.DocumentName}
                </p>
                <p className="text-[10px] text-emerald-600">
                  {existingDoc.FileSizeKB} KB · {existingDoc.FileExtension?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View */}
              {/* <button
                onClick={() => setViewerDoc(existingDoc)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Eye className="w-3 h-3" /> View
              </button> */}

              {/* Download */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Download className="w-3 h-3" /> Download
              </button>

              {/* Replace / Update */}
              {/* <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                <RefreshCw className="w-3 h-3" />
                {uploading ? "Uploading…" : "Replace"}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.tiff"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFile(f);
                    e.target.value = "";
                  }}
                />
              </label> */}

              {/* Delete */}
              <button
                onClick={() => {
                  if (window.confirm("Delete this document?")) {
                    deleteDoc(existingDoc.UserDocumentID);
                  }
                }}
                disabled={isDeleting}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {isDeleting
                  ? <Loader className="w-3 h-3 animate-spin" />
                  : <Trash2 className="w-3 h-3" />
                }
                Delete
              </button>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl px-3 py-4 cursor-pointer transition-all duration-200 ${dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3 pointer-events-none">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                {uploading
                  ? <Loader className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {uploading ? "Uploading…" : "Click or drag & drop"}
                </p>
                <p className="text-[11px] text-slate-400">PDF, JPG, PNG · Max 5MB</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 font-medium">Uploading…</span>
                <span className="text-blue-600 font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Document viewer modal */}
      {viewerDoc && (
        <DocumentViewer
          doc={viewerDoc}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Step4Documents ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export function Step4Documents({ store, nextStep, prevStep }) {
  const { loginResponce } = useUserStore();
  const userId = loginResponce?.userId;
  const queryClient = useQueryClient();

  // ── Fetch categories ────────────────────────────────────────────────────────
  const { data: categoriesData = { data: [] }, isLoading: categoriesLoading } = useQuery({
    queryKey: ["documentCategories"],
    queryFn: DocumentCategoryGet,
    staleTime: Infinity,
  });

  const categories = (categoriesData?.data ?? []).filter(
    (c) => c?.IsActive === true || c?.IsActive === 1,
  );

  // ── Fetch all subcategories ─────────────────────────────────────────────────
  const { data: allSubcategoriesData = { data: [] }, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ["documentSubCategories"],
    queryFn: DocumentSubCategoryGet,
    enabled: categories.length > 0,
    staleTime: Infinity,
  });

  // ── Fetch user's existing documents ────────────────────────────────────────
  const {
    data: existingDocs = [],
    isLoading: existingDocsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ["userDocuments", userId],
    queryFn: () => fetchUserDocuments(userId),
    enabled: !!userId,
    staleTime: 0,        // always fresh
  });

  // ── Group subcategories by category ─────────────────────────────────────────
  const subcategoriesByCategory = useMemo(() => {
    const allSubs = allSubcategoriesData?.data ?? [];
    const grouped = {};
    categories.forEach((cat) => {
      const id = cat.DocumentCategoryID;
      grouped[id] = allSubs.filter(
        (s) => s.DocumentCategoryID === id && (s.IsActive === true || s.IsActive === 1),
      );
    });
    return grouped;
  }, [allSubcategoriesData, categories]);

  // ── Build a lookup: catId-subCatId → existing doc ──────────────────────────
  const existingDocMap = useMemo(() => {
    const map = {};
    (existingDocs ?? []).forEach((doc) => {
      const key = `${doc.DocumentCategoryID}-${doc.DocumentSubCategoryID}`;
      map[key] = doc;
    });
    return map;
  }, [existingDocs]);

  const isLoading = categoriesLoading || subcategoriesLoading || existingDocsLoading;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["userDocuments", userId] });
  };

  return (
    <div className="space-y-6 profileWizardStep">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          Upload one document per subcategory. You can view, replace, download, or delete uploaded documents.
        </p>
      </div>

      {/* Uploaded docs count */}
      {existingDocs.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
            {existingDocs.length}
          </span>
          <span className="text-xs font-semibold text-emerald-700">
            document{existingDocs.length > 1 ? "s" : ""} already uploaded
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-slate-500">Loading…</span>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex items-center justify-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm text-slate-500">No document categories available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const catId = category.DocumentCategoryID;
            const subcats = subcategoriesByCategory[catId] ?? [];

            return (
              <motion.div
                key={catId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pw-section-panel space-y-4"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {category.DocumentCategoryName ?? "Unknown Category"}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {subcats.length} subcategorie{subcats.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {subcats.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No subcategories available
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subcats.map((subcat) => {
                      const subId = subcat.DocumentSubCategoryID;
                      const key = `${catId}-${subId}`;
                      const existing = existingDocMap[key] ?? null;

                      return (
                        <UploadCard
                          key={key}
                          category={category}
                          subCategory={subcat}
                          userId={userId}
                          existingDoc={existing}
                          onRefresh={handleRefresh}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3 pt-6 border-t border-slate-200 mt-8">
        <button
          type="button"
          onClick={prevStep}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs hover:bg-slate-50 transition-all flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={nextStep}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg text-white font-extrabold text-xs hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-1"
        >
          Save & Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}