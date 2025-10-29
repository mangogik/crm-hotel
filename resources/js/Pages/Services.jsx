import { useState, useEffect } from "react";
import { usePage, useForm, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import AuthenticatedLayout from "../Layouts/AuthenticatedLayout";
import { Badge } from "@/components/ui/badge";

import ServiceHeader from "../components/services/ServiceHeader";
import ServiceFilters from "../components/services/ServiceFilters";
import ServicesTable from "../components/services/ServicesTable";
import ServiceForm from "../components/services/ServiceForm";
import DeleteServiceModal from "../components/services/DeleteServiceModal";
import Pagination from "../components/services/Pagination";
import ServiceHighlightCard from "../components/services/insights/ServiceHighlightCard";
import RankTableCard from "../components/services/insights/RankTableCard";
import ServiceImagesDialog from "../components/services/ServiceImagesDialog";

export default function Services() {
  const { services, filters, flash, insights, filterOptions } = usePage().props;

  // ===== FILTERS / SORT =====
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [selectedType, setSelectedType] = useState(filters.type || "all");
  const [selectedFulfillment, setSelectedFulfillment] = useState(
    filters.fulfillment_type || "all"
  );
  const [selectedOfferingSession, setSelectedOfferingSession] = useState(
    filters.offering_session || "all"
  );
  const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
  const [sortDirection, setSortDirection] = useState(
    filters.sort_direction || "desc"
  );

  // ===== MODALS =====
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // preview images modal (lazy fetch inside dialog)
  const [isImagesModalOpen, setIsImagesModalOpen] = useState(false);
  const [imagePreviewService, setImagePreviewService] = useState(null);

  // ===== TABLE / ROW STATE =====
  const [currentService, setCurrentService] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);

  // force remount of form for clean state
  const [formKey, setFormKey] = useState(0);

  // tiny loading flag for edit images fetch
  const [loadingImagesForEdit, setLoadingImagesForEdit] = useState(false);

  // ===== BASE FORM DATA (Inertia) =====
  const { data, setData, processing, errors, reset, clearErrors } = useForm({
    name: "",
    description: "",
    type: "fixed",
    fulfillment_type: "direct",
    offering_session: "post_checkin",
    price: "",
    unit_name: "",
    options: [{ name: "", price: "" }],
    has_questions: false,
    questions: [""],
  });

  // ===== IMAGE STATE =====
  // existing from DB (edit mode init fetch)
  const [existingGeneralImages, setExistingGeneralImages] = useState([]);
  // { optionKey: [ {id,url,...} ] }
  const [existingOptionImagesByKey, setExistingOptionImagesByKey] = useState(
    {}
  );

  // track deletions for UPDATE
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [optionImagesToDelete, setOptionImagesToDelete] = useState([]);

  // newly added general images (unsaved yet)
  const [newGeneralImages, setNewGeneralImages] = useState([]); // [File,...]
  // local previews [{file, url}]
  const [newGeneralPreviews, setNewGeneralPreviews] = useState([]);

  // newly picked per-option image file (replacement, 1 each)
  // { [optionKey]: File }
  const [newOptionImages, setNewOptionImages] = useState({});
  // previews for that replacement
  // { [optionKey]: objectURL }
  const [newOptionImagePreviews, setNewOptionImagePreviews] = useState({});

  // questions initial (for edit, so the toggle starts correct)
  const [initialHasQuestions, setInitialHasQuestions] = useState(false);
  const [initialQuestions, setInitialQuestions] = useState([""]);

  // ===== FLASH TOAST =====
  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
  }, [flash]);

  // ===== FILTER DEBOUNCE =====
  useEffect(() => {
    const timer = setTimeout(() => applyFilters(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    selectedType,
    selectedFulfillment,
    selectedOfferingSession,
    sortBy,
    sortDirection,
  ]);

  const applyFilters = (page = 1) => {
    router.get(
      route("services.index"),
      {
        search: searchTerm,
        type: selectedType === "all" ? "" : selectedType,
        fulfillment_type:
          selectedFulfillment === "all" ? "" : selectedFulfillment,
        offering_session:
          selectedOfferingSession === "all"
            ? ""
            : selectedOfferingSession,
        sort_by: sortBy,
        sort_direction: sortDirection,
        page,
      },
      { preserveState: true, replace: true }
    );
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  // ===== PREVIEW MODAL OPEN =====
  const openImagesModal = (service) => {
    setImagePreviewService({
      id: service.id,
      name: service.name,
      type: service.type,
    });
    setIsImagesModalOpen(true);
  };

  // ===== IMAGE HELPERS =====

  // remove existing (DB) general image during EDIT
  const markDeleteGeneralImage = (imgId) => {
    setExistingGeneralImages((prev) => prev.filter((img) => img.id !== imgId));
    setImagesToDelete((prev) => [...prev, imgId]);
  };

  // optional helper for per-option existing images
  // (dipanggil kalau nanti kamu bikin tombol hapus foto per-option)
  const markDeleteOptionImage = (imgId, optionKey) => {
    setExistingOptionImagesByKey((prev) => {
      const copy = { ...prev };
      if (!copy[optionKey]) return copy;
      copy[optionKey] = copy[optionKey].filter((img) => img.id !== imgId);
      return copy;
    });
    setOptionImagesToDelete((prev) => [...prev, imgId]);
  };

  // remove local new general preview (not DB yet)
  const removeNewGeneralPreview = (idxToRemove) => {
    setNewGeneralPreviews((prev) =>
      prev.filter((_, i) => i !== idxToRemove)
    );
    setNewGeneralImages((prev) =>
      prev.filter((_, i) => i !== idxToRemove)
    );
  };

  // user picks new per-option image
  const handleReplaceOptionImage = (optionKey, fileList) => {
    const file = fileList?.[0];
    if (!file) return;

    // ⛔️ IMPORTANT: jangan auto-delete semua foto lama di option ini.
    // Dulu kita lakukan ini:
    //   const existingArr = existingOptionImagesByKey[optionKey] || [];
    //   const idsToRemove = existingArr.map(img => img.id);
    //   setOptionImagesToDelete([...prev, ...idsToRemove])
    //
    // Itu bikin foto lama langsung hilang.
    // Sekarang kita cukup APPEND foto baru.

    // simpan file baru agar ikut terkirim saat submit
    setNewOptionImages((prev) => ({
      ...prev,
      [optionKey]: file,
    }));

    // simpan preview baru buat UI
    setNewOptionImagePreviews((prev) => ({
      ...prev,
      [optionKey]: URL.createObjectURL(file),
    }));
  };

  // user adds general images
  const addNewGeneralImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const previewsToAdd = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));

    setNewGeneralImages((prev) => [...prev, ...files]);
    setNewGeneralPreviews((prev) => [...prev, ...previewsToAdd]);
  };

  // ===== CREATE MODAL OPEN =====
  const openCreateModal = () => {
    reset();
    clearErrors();

    // base form defaults
    setData({
      name: "",
      description: "",
      type: "fixed",
      fulfillment_type: "direct",
      offering_session: "post_checkin",
      price: "",
      unit_name: "",
      options: [{ name: "", price: "" }],
      has_questions: false,
      questions: [""],
    });

    // reset all image / question helper state
    setExistingGeneralImages([]);
    setExistingOptionImagesByKey({});
    setImagesToDelete([]);
    setOptionImagesToDelete([]);

    setNewGeneralImages([]);
    setNewGeneralPreviews([]);
    setNewOptionImages({});
    setNewOptionImagePreviews({});

    setInitialHasQuestions(false);
    setInitialQuestions([""]);

    setFormKey((k) => k + 1);
    setIsCreateModalOpen(true);
  };

  // ===== EDIT MODAL OPEN =====
  const openEditModal = (service) => {
    // buka modal dulu biar UX ga nunggu
    setIsEditModalOpen(true);

    setCurrentService(service);
    clearErrors();

    // hydrate form fields
    setData({
      name: service.name,
      description: service.description || "",
      type: service.type,
      fulfillment_type: service.fulfillment_type,
      offering_session: service.offering_session || "post_checkin",
      price: service.price || "",
      unit_name: service.unit_name || "",
      options:
        service.options && service.options.length > 0
          ? service.options
          : [{ name: "", price: "" }],
      has_questions: service.has_active_questions || false,
      questions: service.active_question?.questions_json || [""],
    });

    // hydrate Q init
    setInitialHasQuestions(service.has_active_questions || false);
    setInitialQuestions(service.active_question?.questions_json || [""]);

    // reset local image session
    setExistingGeneralImages([]);
    setExistingOptionImagesByKey({});
    setImagesToDelete([]);
    setOptionImagesToDelete([]);

    setNewGeneralImages([]);
    setNewGeneralPreviews([]);
    setNewOptionImages({});
    setNewOptionImagePreviews({});

    setLoadingImagesForEdit(true);
    setFormKey((k) => k + 1);

    // fetch images live for this service
    (async () => {
      try {
        const res = await fetch(route("services.images", service.id), {
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (res.ok) {
          const json = await res.json();

          const general = Array.isArray(json.images) ? json.images : [];

          // group option images by option_key
          const optionImgs = Array.isArray(json.optionImages)
            ? json.optionImages
            : [];
          const grouped = {};
          optionImgs.forEach((img) => {
            const key = img.option_key || "unknown";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(img);
          });

          setExistingGeneralImages(general);
          setExistingOptionImagesByKey(grouped);
        } else {
          setExistingGeneralImages([]);
          setExistingOptionImagesByKey({});
        }
      } catch (err) {
        console.error("Failed loading service images", err);
        setExistingGeneralImages([]);
        setExistingOptionImagesByKey({});
      } finally {
        setLoadingImagesForEdit(false);
      }
    })();
  };

  // ===== DELETE MODAL OPEN =====
  const openDeleteModal = (service) => {
    setCurrentService(service);
    setIsDeleteModalOpen(true);
  };

  // ===== TABLE ROW EXPAND =====
  const toggleRow = (id) =>
    setExpandedRows((prev) =>
      prev.includes(id)
        ? prev.filter((rowId) => rowId !== id)
        : [...prev, id]
    );

  // ===== OPTION LIST MUTATION =====
  const addOption = () => {
    setData("options", [...data.options, { name: "", price: "" }]);
  };

  const removeOption = (index) => {
    if (data.options.length <= 1) return;

    const removedOption = data.options[index];
    const removedKey = removedOption.key || `opt_${index + 1}`;

    // 1. update options array
    const newOptions = data.options.filter((_, i) => i !== index);
    setData("options", newOptions);

    // 2. clean per-option image states
    setExistingOptionImagesByKey((prev) => {
      const copy = { ...prev };
      delete copy[removedKey];
      return copy;
    });

    setNewOptionImages((prev) => {
      const copy = { ...prev };
      delete copy[removedKey];
      return copy;
    });

    setNewOptionImagePreviews((prev) => {
      const copy = { ...prev };
      delete copy[removedKey];
      return copy;
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...data.options];
    newOptions[index][field] = value;
    setData("options", newOptions);
  };

  // ===== FILTER RESET =====
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedFulfillment("all");
    setSelectedOfferingSession("all");
    setSortBy("created_at");
    setSortDirection("desc");
  };

  // ===== FORMAT BADGES =====
  const formatPrice = (price) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);

  const getTypeBadge = (type, unitName) => {
    let label = type;
    switch (type) {
      case "fixed":
        label = "Fixed";
        break;
      case "per_unit":
        label = `Per Unit ${unitName ? `(${unitName})` : ""}`;
        break;
      case "selectable":
        label = "Select";
        break;
      case "multiple_options":
        label = "Multi-Select";
        break;
      default:
        label = type;
    }

    const colorClasses = {
      fixed: "bg-blue-100 text-blue-800 border-blue-200",
      per_unit: "bg-emerald-100 text-emerald-800 border-emerald-200",
      selectable: "bg-violet-100 text-violet-800 border-violet-200",
      multiple_options:
        "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
      free: "bg-rose-100 text-rose-800 border-rose-200",
    };

    const badgeColor =
      colorClasses[type] ||
      "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <Badge
        className={`capitalize text-xs font-medium w-28 justify-center ${badgeColor}`}
        variant="outline"
      >
        {label}
      </Badge>
    );
  };

  const getFulfillmentBadge = (fulfillment) => {
    let label = fulfillment;
    switch (fulfillment) {
      case "direct":
        label = "Direct";
        break;
      case "staff_assisted":
        label = "Staff Assisted";
        break;
      default:
        label = fulfillment;
    }

    const colorClasses = {
      direct: "bg-slate-100 text-slate-800 border-slate-200",
      staff_assisted:
        "bg-amber-100 text-amber-800 border-amber-200",
    };

    const badgeColor =
      colorClasses[fulfillment] ||
      "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <Badge
        className={`capitalize text-xs font-medium w-32 justify-center ${badgeColor}`}
        variant="outline"
      >
        {label}
      </Badge>
    );
  };

  const getOfferingSessionBadge = (session) => {
    let label = session ? session.replace("_", " ") : "N/A";
    switch (session) {
      case "pre_checkin":
        label = "Pre Check-in";
        break;
      case "post_checkin":
        label = "Post Check-in";
        break;
      case "pre_checkout":
        label = "Pre Checkout";
        break;
      case "free":
        label = "Free";
        break;
      default:
        label = session;
    }

    const colorClasses = {
      pre_checkin:
        "bg-indigo-100 text-indigo-800 border-indigo-200",
      post_checkin:
        "bg-green-100 text-green-800 border-green-200",
      pre_checkout:
        "bg-orange-100 text-orange-800 border-orange-200",
      free: "bg-rose-100 text-rose-800 border-rose-200",
    };

    const badgeColor =
      colorClasses[session] ||
      "bg-gray-100 text-gray-800 border-gray-200";

    return (
      <Badge
        className={`capitalize text-xs font-medium w-32 justify-center ${badgeColor}`}
        variant="outline"
      >
        {label}
      </Badge>
    );
  };

  // ===== PAGINATION =====
  const buildPaginationUrl = (url) => {
    if (!url) return null;
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    params.set("search", searchTerm);
    params.set("type", selectedType === "all" ? "" : selectedType);
    params.set(
      "fulfillment_type",
      selectedFulfillment === "all" ? "" : selectedFulfillment
    );
    params.set(
      "offering_session",
      selectedOfferingSession === "all"
        ? ""
        : selectedOfferingSession
    );
    params.set("sort_by", sortBy);
    params.set("sort_direction", sortDirection);
    return `${urlObj.pathname}?${params.toString()}`;
  };

  // ===== BUILD FORMDATA =====
  // Controller expectations:
  // - CREATE:
  //    images[]                      (service-level)
  //    option_images[<optionKey>]    (per-option)
  //
  // - UPDATE:
  //    _method = PUT
  //    images[]                      (append general images)
  //    images_to_delete[]            (ids to remove general)
  //    option_images_new[<optionKey>] (append per-option image)
  //    option_images_to_delete[]     (ids to remove option-level)
  const buildFormDataFromState = (isUpdate = false) => {
    const fd = new FormData();

    if (isUpdate) {
      fd.append("_method", "PUT");
    }

    fd.append("name", data.name ?? "");
    fd.append("description", data.description ?? "");
    fd.append("type", data.type ?? "");
    fd.append("fulfillment_type", data.fulfillment_type ?? "");
    fd.append("offering_session", data.offering_session ?? "");
    fd.append("price", data.price ?? "");
    fd.append("unit_name", data.unit_name ?? "");

    fd.append("has_questions", data.has_questions ? "1" : "0");
    if (data.has_questions && Array.isArray(data.questions)) {
      data.questions.forEach((q, idx) => {
        fd.append(`questions[${idx}]`, q ?? "");
      });
    }

    if (Array.isArray(data.options)) {
      data.options.forEach((opt, idx) => {
        fd.append(`options[${idx}][name]`, opt.name ?? "");
        fd.append(`options[${idx}][price]`, opt.price ?? "");
        if (opt.key) {
          fd.append(`options[${idx}][key]`, opt.key);
        }
      });
    }

    // deletions (only meaningful for update)
    imagesToDelete.forEach((imgId, idx) => {
      fd.append(`images_to_delete[${idx}]`, imgId);
    });

    optionImagesToDelete.forEach((imgId, idx) => {
      fd.append(`option_images_to_delete[${idx}]`, imgId);
    });

    // new general uploads
    newGeneralImages.forEach((file, idx) => {
      if (file) {
        fd.append(`images[${idx}]`, file);
      }
    });

    // per-option uploads
    Object.entries(newOptionImages).forEach(([optionKey, file]) => {
      if (!file) return;

      if (isUpdate) {
        // match ServiceController@update -> option_images_new
        fd.append(`option_images_new[${optionKey}]`, file);
      } else {
        // match ServiceController@store -> option_images
        fd.append(`option_images[${optionKey}]`, file);
      }
    });

    return fd;
  };

  // ===== SUBMIT CREATE =====
  const handleCreate = (e) => {
    e.preventDefault();
    const fd = buildFormDataFromState(false);

    router.post(route("services.store"), fd, {
      forceFormData: true,
      onSuccess: () => {
        // close + cleanup state after success
        setIsCreateModalOpen(false);
        reset();

        setExistingGeneralImages([]);
        setExistingOptionImagesByKey({});
        setImagesToDelete([]);
        setOptionImagesToDelete([]);

        setNewGeneralImages([]);
        setNewGeneralPreviews([]);
        setNewOptionImages({});
        setNewOptionImagePreviews({});

        setFormKey((k) => k + 1);
      },
    });
  };

  // ===== SUBMIT UPDATE =====
  const handleUpdate = (e) => {
    e.preventDefault();
    const fd = buildFormDataFromState(true);

    router.post(route("services.update", currentService.id), fd, {
      forceFormData: true,
      onSuccess: () => {
        setIsEditModalOpen(false);
        reset();

        setExistingGeneralImages([]);
        setExistingOptionImagesByKey({});
        setImagesToDelete([]);
        setOptionImagesToDelete([]);

        setNewGeneralImages([]);
        setNewGeneralPreviews([]);
        setNewOptionImages({});
        setNewOptionImagePreviews({});

        setFormKey((k) => k + 1);
      },
      onError: () => {
        // keep modal open to show validation errors
      },
    });
  };

  // ===== SUBMIT DELETE =====
  const handleDelete = () => {
    router.delete(route("services.destroy", currentService.id), {
      onSuccess: () => setIsDeleteModalOpen(false),
    });
  };

  // ===== RENDER =====
  return (
    <div className="container mx-auto py-2 px-4">
      <Card className="mb-8">
        <ServiceHeader onAddService={openCreateModal} />
        <CardContent>
          <ServiceFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedFulfillment={selectedFulfillment}
            setSelectedFulfillment={setSelectedFulfillment}
            selectedOfferingSession={selectedOfferingSession}
            setSelectedOfferingSession={setSelectedOfferingSession}
            clearFilters={clearFilters}
            filterOptions={filterOptions}
          />

          <ServicesTable
            services={services.data}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
            openImagesModal={openImagesModal}
            formatPrice={formatPrice}
            sortBy={sortBy}
            sortDirection={sortDirection}
            handleSort={handleSort}
            getTypeBadge={getTypeBadge}
            getFulfillmentBadge={getFulfillmentBadge}
            getOfferingSessionBadge={getOfferingSessionBadge}
          />

          <Pagination
            paginationData={services}
            buildPaginationUrl={buildPaginationUrl}
            router={router}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Services Insights
          </CardTitle>
          <CardDescription>
            Insights from your services data
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <ServiceHighlightCard
            popularService={insights.mostPopular}
            profitableService={insights.highestRevenue}
            formatPrice={formatPrice}
          />
          <RankTableCard data={insights.topServices} />
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="w-[96vw] sm:max-w-[1200px] lg:max-w-[1400px] max-h-[88vh]">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Add a new service to your offerings
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto pr-1" style={{ maxHeight: "68vh" }}>
            <form onSubmit={handleCreate}>
              <ServiceForm
                key={`create-${formKey}`}
                mode="create"
                data={data}
                setData={setData}
                errors={errors}
                addOption={addOption}
                removeOption={removeOption}
                updateOption={updateOption}
                initialHasQuestions={initialHasQuestions}
                initialQuestions={initialQuestions}
                existingGeneralImages={[]} // none yet
                existingOptionImagesByKey={{}} // none yet
                markDeleteGeneralImage={() => {}}
                markDeleteOptionImage={() => {}}
                newGeneralImages={newGeneralImages}
                newGeneralPreviews={newGeneralPreviews}
                setNewGeneralImages={setNewGeneralImages}
                setNewGeneralPreviews={setNewGeneralPreviews}
                newOptionImages={newOptionImages}
                newOptionImagePreviews={newOptionImagePreviews}
                setNewOptionImages={setNewOptionImages}
                setNewOptionImagePreviews={setNewOptionImagePreviews}
                handleReplaceOptionImage={handleReplaceOptionImage}
                addNewGeneralImages={addNewGeneralImages}
                removeNewGeneralPreview={removeNewGeneralPreview}
                loadingImagesForEdit={false}
              />
            </form>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="submit"
              disabled={processing}
              onClick={handleCreate}
            >
              Create Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="w-[96vw] sm:max-w-[1200px] lg:max-w-[1400px] max-h-[88vh]">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update service information
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-auto pr-1" style={{ maxHeight: "68vh" }}>
            <form onSubmit={handleUpdate}>
              <ServiceForm
                key={`edit-${formKey}`}
                mode="edit"
                data={data}
                setData={setData}
                errors={errors}
                addOption={addOption}
                removeOption={removeOption}
                updateOption={updateOption}
                initialHasQuestions={initialHasQuestions}
                initialQuestions={initialQuestions}
                existingGeneralImages={existingGeneralImages}
                existingOptionImagesByKey={existingOptionImagesByKey}
                markDeleteGeneralImage={markDeleteGeneralImage}
                markDeleteOptionImage={markDeleteOptionImage}
                newGeneralImages={newGeneralImages}
                newGeneralPreviews={newGeneralPreviews}
                setNewGeneralImages={setNewGeneralImages}
                setNewGeneralPreviews={setNewGeneralPreviews}
                newOptionImages={newOptionImages}
                newOptionImagePreviews={newOptionImagePreviews}
                setNewOptionImages={setNewOptionImages}
                setNewOptionImagePreviews={setNewOptionImagePreviews}
                handleReplaceOptionImage={handleReplaceOptionImage}
                addNewGeneralImages={addNewGeneralImages}
                removeNewGeneralPreview={removeNewGeneralPreview}
                loadingImagesForEdit={loadingImagesForEdit}
              />
            </form>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="submit"
              disabled={processing}
              onClick={handleUpdate}
            >
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <DeleteServiceModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        service={currentService}
      />

      {/* IMAGE PREVIEW MODAL */}
      <ServiceImagesDialog
        open={isImagesModalOpen}
        onOpenChange={setIsImagesModalOpen}
        serviceMeta={imagePreviewService}
      />
    </div>
  );
}

Services.layout = (page) => <AuthenticatedLayout children={page} />;
