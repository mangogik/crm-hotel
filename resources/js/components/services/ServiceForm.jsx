import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  HelpCircle,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import { Textarea } from "../ui/textarea";

/* ---------- constants for FE validation ---------- */
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const Box = ({ title, subtitle, children, className = "", bodyClassName = "" }) => (
  <div className={`rounded-lg border bg-white shadow-sm flex flex-col ${className}`}>
    <div className="px-4 py-3 border-b sticky top-0 z-10 bg-white">
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      )}
    </div>
    <div className={`p-4 overflow-y-auto ${bodyClassName}`}>{children}</div>
  </div>
);

const Row = ({ label, htmlFor, error, children }) => (
  <div className="grid grid-cols-4 items-start gap-3">
    <Label htmlFor={htmlFor} className="text-right text-sm pt-2">
      {label}
    </Label>
    <div className="col-span-3">
      {children}
      {error && (
        <p className="text-red-500 text-xs text-right mt-1">{error}</p>
      )}
    </div>
  </div>
);

const Hint = ({ children }) => (
  <p className="text-xs text-muted-foreground mt-1">{children}</p>
);

const ImgSkeleton = ({ size = "w-14 h-14" }) => (
  <div
    className={`${size} rounded-md border bg-muted/40 animate-pulse flex items-center justify-center text-[10px] text-muted-foreground`}
  >
    <Loader2 className="w-4 h-4 animate-spin opacity-60" />
  </div>
);

/**
 * Compact row to preview & change photo for each option
 */
function OptionImageRow({
  mode,
  loadingImagesForEdit,
  currentExisting,
  newPreviewUrl,
  optionName,
  onTriggerPickFile,
  localError, // NEW
}) {
  return (
    <div className="bg-muted/5 rounded-md border px-2 py-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* CURRENT -> NEW side by side */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* CURRENT */}
          <div className="flex flex-col items-center text-center min-w-[3.5rem]">
            <div className="text-[10px] text-muted-foreground mb-1 leading-none">
              Current
            </div>

            {mode === "edit" && loadingImagesForEdit && <ImgSkeleton />}

            {mode === "edit" && !loadingImagesForEdit && currentExisting && (
              <div className="w-14 h-14 border rounded-md bg-white shadow-sm overflow-hidden">
                <img
                  src={currentExisting.url}
                  alt={currentExisting.option_name || "option image"}
                  className="object-cover w-full h-full"
                />
              </div>
            )}

            {mode === "create" && (
              <div className="w-14 h-14 border rounded-md bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground">
                —
              </div>
            )}

            {mode === "edit" &&
              !loadingImagesForEdit &&
              !currentExisting && (
                <div className="w-14 h-14 border rounded-md bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground">
                  —
                </div>
              )}
          </div>

          {/* ARROW */}
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

          {/* NEW */}
          <div className="flex flex-col items-center text-center min-w-[3.5rem]">
            <div className="text-[10px] text-muted-foreground mb-1 leading-none">
              New
            </div>

            {newPreviewUrl ? (
              <div className="relative w-14 h-14 border rounded-md bg-white ring-2 ring-purple-500/40 shadow-sm overflow-hidden">
                <img
                  src={newPreviewUrl}
                  alt="new option preview"
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[9px] leading-tight px-1 py-[2px] text-center">
                  new
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 border rounded-md bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground">
                —
              </div>
            )}
          </div>
        </div>

        {/* ACTION + HINT */}
        <div className="flex items-center gap-2 min-w-[7rem] mt-4">
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-7 text-[11px] flex items-center gap-1 p-2"
            onClick={onTriggerPickFile}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Change Photo
          </Button>
          <span className="text-[10px] text-muted-foreground leading-tight max-w-[10rem]">
            JPG / PNG / WebP • max 2MB.
          </span>
        </div>
      </div>

      <div className="pl-[2px]">
        {localError ? (
          <p className="text-[10px] text-red-600 leading-relaxed">
            {localError}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Guest will see this thumbnail when choosing the option. Only one
            photo per option.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * One option block containing fields + per-option image picker
 */
function OptionBlock({
  mode,
  index,
  option,
  totalOptions,
  updateOption,
  removeOption,
  loadingImagesForEdit,
  existingOptionImagesByKey,
  newOptionImagePreviews,
  handleReplaceOptionImageSafe, // UPDATED prop name
  optionImageErrors, // NEW { [optionKey]: "error msg" }
}) {
  const optionKey = option.key || `opt_${index + 1}`;

  // existing images for this option
  const existingArr = existingOptionImagesByKey[optionKey] || [];
  const currentExisting = existingArr[0] || null;

  // new preview (if user picked file)
  const newPreviewUrl = newOptionImagePreviews[optionKey] || null;

  // hidden file input ref
  const fileInputRef = useRef(null);

  const triggerPickFile = () => {
    fileInputRef.current?.click();
  };

  const onFilePicked = (e) => {
    handleReplaceOptionImageSafe(optionKey, e.target.files);
  };

  return (
    <div className="rounded-md border p-3 space-y-3">
      {/* base fields */}
      <div className="grid grid-cols-12 gap-2">
        <Input
          placeholder="Option name"
          value={option.name}
          onChange={(ev) => updateOption(index, "name", ev.target.value)}
          className="col-span-6"
        />
        <Input
          type="number"
          placeholder="Price"
          min="0"
          step="0.01"
          value={option.price}
          onChange={(ev) => updateOption(index, "price", ev.target.value)}
          className="col-span-4"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeOption(index)}
          disabled={totalOptions <= 1}
          className="col-span-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* photo row */}
      <OptionImageRow
        mode={mode}
        loadingImagesForEdit={loadingImagesForEdit}
        currentExisting={currentExisting}
        newPreviewUrl={newPreviewUrl}
        optionName={option.name}
        onTriggerPickFile={triggerPickFile}
        localError={optionImageErrors[optionKey] || ""} // NEW
      />

      {/* hidden file input for this option */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFilePicked}
      />
    </div>
  );
}

/**
 * Service-level gallery upload/preview
 */
function GeneralImagesPreview({
  mode,
  loadingImagesForEdit,
  existingGeneralImages,
  newGeneralPreviews,
  onDeleteExisting,
  onDeleteNew,
  onAddNewSafe, // UPDATED prop
  localError, // NEW
}) {
  return (
    <div className="space-y-2">
      {/* thumbnails row */}
      <div className="flex flex-wrap gap-2">
        {/* existing (DB) thumbnails */}
        {mode === "edit" && loadingImagesForEdit && (
          <>
            <ImgSkeleton />
            <ImgSkeleton />
          </>
        )}

        {mode === "edit" &&
          !loadingImagesForEdit &&
          existingGeneralImages.length > 0 &&
          existingGeneralImages.map((img) => (
            <div
              key={img.id}
              className="relative w-16 h-16 border rounded-md bg-white shadow-sm overflow-hidden"
            >
              <img
                src={img.url}
                alt={img.caption || "service image"}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                className="absolute top-0 right-0 bg-red-600 text-white rounded-bl-md px-1 py-[2px] text-[10px] flex items-center gap-1"
                onClick={() => onDeleteExisting(img.id)}
                title="Remove this image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

        {/* local new previews */}
        {newGeneralPreviews.length > 0 &&
          newGeneralPreviews.map((item, idx) => (
            <div
              key={`new-${idx}`}
              className="relative w-16 h-16 border rounded-md bg-white ring-2 ring-purple-500/40 shadow-sm overflow-hidden"
            >
              <img
                src={item.url}
                alt={item.file?.name || "new image"}
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                className="absolute top-0 right-0 bg-purple-600 text-white rounded-bl-md px-1 py-[2px] text-[10px] flex items-center gap-1"
                onClick={() => onDeleteNew(idx)}
                title="Remove this new image"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-[9px] leading-tight px-1 py-[2px] text-center">
                new
              </div>
            </div>
          ))}
      </div>

      {/* add button + hint / error */}
      <div className="flex flex-col gap-1">
        <label className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border rounded-md bg-white hover:bg-muted cursor-pointer w-fit">
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => onAddNewSafe(e.target.files)}
          />
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Add Images</span>
        </label>

        {localError ? (
          <div className="text-[10px] text-red-600 leading-tight">
            {localError}
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground leading-tight">
            JPG / PNG / WebP • max 2MB each. You can remove them here before
            saving.
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServiceForm({
  mode, // "create" | "edit"

  data,
  setData,
  errors,

  addOption,
  removeOption,
  updateOption,

  initialHasQuestions,
  initialQuestions,

  // IMAGES props from parent
  existingGeneralImages,
  existingOptionImagesByKey,
  markDeleteGeneralImage,
  // markDeleteOptionImage is still available upstream if needed

  newGeneralImages,
  newGeneralPreviews,
  setNewGeneralImages,
  setNewGeneralPreviews,

  newOptionImages,
  newOptionImagePreviews,
  setNewOptionImages,
  setNewOptionImagePreviews,

  handleReplaceOptionImage, // ORIGINAL unsafe (no FE validation)
  addNewGeneralImages,      // ORIGINAL unsafe (no FE validation)
  removeNewGeneralPreview,

  loadingImagesForEdit,
}) {
  // ===== local FE validation error states =====
  const [galleryError, setGalleryError] = useState(""); // general service gallery error
  const [optionImageErrors, setOptionImageErrors] = useState({}); // { [optionKey]: "error" }

  // ---- wrappers that enforce size/type before calling original logic ----

  // general gallery (multi)
  const onAddNewSafe = (fileList) => {
    if (!fileList || !fileList.length) return;

    const goodFiles = [];
    let badReason = "";

    Array.from(fileList).forEach((file) => {
      if (file.size > MAX_SIZE_BYTES) {
        badReason = "One or more images exceed 2MB.";
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        badReason = "Only JPG, PNG, or WebP images are allowed.";
        return;
      }
      goodFiles.push(file);
    });

    if (badReason) {
      setGalleryError(badReason);
    } else {
      setGalleryError("");
    }

    if (goodFiles.length > 0) {
      // Reuse your existing addNewGeneralImages to push them into state
      const dt = new DataTransfer();
      goodFiles.forEach((f) => dt.items.add(f));
      addNewGeneralImages(dt.files);
    }
  };

  // per-option single image
  const handleReplaceOptionImageSafe = (optionKey, fileList) => {
    if (!fileList || !fileList.length) return;

    const file = fileList[0];

    if (file.size > MAX_SIZE_BYTES) {
      setOptionImageErrors((prev) => ({
        ...prev,
        [optionKey]: "Image too large. Max size is 2MB.",
      }));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setOptionImageErrors((prev) => ({
        ...prev,
        [optionKey]: "Unsupported format. Use JPG, PNG, or WebP.",
      }));
      return;
    }

    // clear error for this optionKey
    setOptionImageErrors((prev) => ({
      ...prev,
      [optionKey]: "",
    }));

    // Call the original parent handler (which updates newOptionImages / previews)
    handleReplaceOptionImage(optionKey, fileList);
  };

  // ===== QUESTIONS STATE =====
  const [hasQuestions, setHasQuestions] = useState(
    data.has_questions || initialHasQuestions || false
  );
  const [questions, setQuestions] = useState(
    data.questions && data.questions.length
      ? data.questions
      : initialQuestions && initialQuestions.length
      ? initialQuestions
      : [""]
  );

  useEffect(() => {
    setHasQuestions(data.has_questions || initialHasQuestions || false);
    setQuestions(
      data.questions && data.questions.length
        ? data.questions
        : initialQuestions && initialQuestions.length
        ? initialQuestions
        : [""]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setData("has_questions", hasQuestions);
    setData("questions", hasQuestions ? questions : []);
  }, [hasQuestions, questions, setData]);

  // ===== TYPE LOGIC =====
  const isSelectable = data.type === "selectable";
  const isMulti = data.type === "multiple_options";
  const isPerUnit = data.type === "per_unit";
  const isFixed = data.type === "fixed";
  const isFree = data.type === "free";

  useEffect(() => {
    if (isFree) {
        if (data.price !== 0) setData("price", 0);
        if (data.unit_name) setData("unit_name", "");
        if (data.options?.length) setData("options", [{ name: "", price: "" }]);
    } else if (isFixed) {
        if (data.price === "" || data.price === 0) setData("price", "");
        setData("unit_name", "");
    } else if (isPerUnit) {
        if (!data.unit_name) setData("unit_name", "");
        if (data.price === "" || data.price === 0) setData("price", "");
    } else if (isSelectable || isMulti) {
        if (!data.options?.length)
            setData("options", [{ name: "", price: "" }]);
        if (data.price !== 0) setData("price", 0);
        setData("unit_name", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.type]);

  const typeHint = useMemo(() => {
    if (isPerUnit)
      return "Guest enters quantity; total = qty × price per unit.";
    if (isFixed) return "Single fixed price for this service.";
    if (isSelectable)
      return "Guest picks exactly one option; price comes from that option.";
    if (isMulti)
      return "Guest may pick multiple options; total is sum of chosen options.";
    if (isFree) return "Complimentary service (price = 0).";
    return "";
  }, [isPerUnit, isFixed, isSelectable, isMulti, isFree]);

  // ===== QUESTIONS HANDLERS =====
  const addQuestionLocal = () => setQuestions((qs) => [...qs, ""]);
  const removeQuestionLocal = (index) =>
    setQuestions((qs) =>
      qs.length <= 1 ? qs : qs.filter((_, i) => i !== index)
    );
  const updateQuestionLocal = (index, value) =>
    setQuestions((qs) => {
      const next = [...qs];
      next[index] = value;
      return next;
    });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* LEFT BOX */}
      <Box
        title="Basics & Configuration"
        subtitle={typeHint || "Core details and placement in guest journey."}
        className="min-h-[40vh]"
        bodyClassName="max-h-[68vh]"
      >
        <div className="grid gap-4">
          {/* BASICS */}
          <div className="space-y-3">
            <Row label="Name *" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                value={data.name}
                onChange={(e) => setData("name", e.target.value)}
              />
            </Row>

            <Row
              label="Description"
              htmlFor="description"
              error={errors.description}
            >
              <Textarea
                id="description"
                value={data.description}
                onChange={(e) => setData("description", e.target.value)}
              />
            </Row>

            <Row label="Images" htmlFor="images" error={errors.images}>
              <GeneralImagesPreview
                mode={mode}
                loadingImagesForEdit={loadingImagesForEdit}
                existingGeneralImages={existingGeneralImages}
                newGeneralPreviews={newGeneralPreviews}
                onDeleteExisting={markDeleteGeneralImage}
                onDeleteNew={removeNewGeneralPreview}
                onAddNewSafe={onAddNewSafe}           // UPDATED
                localError={galleryError}              // NEW
              />
            </Row>
          </div>

          {/* CONFIG */}
          <div className="space-y-3">
            <Row label="Type *" htmlFor="type" error={errors.type}>
              <Select
                value={data.type}
                onValueChange={(v) => setData("type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                  <SelectItem value="per_unit">Per Unit</SelectItem>
                  <SelectItem value="selectable">Selectable Options</SelectItem>
                  <SelectItem value="multiple_options">
                    Multiple Options
                  </SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row
              label="Fulfillment *"
              htmlFor="fulfillment_type"
              error={errors.fulfillment_type}
            >
              <Select
                value={data.fulfillment_type}
                onValueChange={(v) => setData("fulfillment_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fulfillment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="staff_assisted">Staff Assisted</SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row
              label="Session *"
              htmlFor="offering_session"
              error={errors.offering_session}
            >
              <Select
                value={data.offering_session}
                onValueChange={(v) => setData("offering_session", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_checkin">Pre Check-in</SelectItem>
                  <SelectItem value="post_checkin">Post Check-in</SelectItem>
                  <SelectItem value="pre_checkout">Pre Checkout</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </div>
        </div>
      </Box>

      {/* RIGHT COLUMN */}
      <div className="flex flex-col gap-4">
        {/* PRICING / OPTIONS */}
        <Box
          title={isFixed || isPerUnit ? "Pricing" : "Options"}
          subtitle={
            isFixed
              ? "Set a single fixed price."
              : isPerUnit
              ? "Set unit name and price per unit."
              : isSelectable
              ? "Guests select exactly one option."
              : isMulti
              ? "Guests can select more than one option."
              : isFree
              ? "Complimentary service (price = 0)."
              : ""
          }
          bodyClassName="max-h-[32vh]"
        >
          {(isFixed || isPerUnit) && (
            <div className="space-y-3">
              {isFixed && (
                <Row label="Price *" htmlFor="price" error={errors.price}>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.price}
                    onChange={(e) => setData("price", e.target.value)}
                  />
                </Row>
              )}

              {isPerUnit && (
                <>
                  <Row
                    label="Unit Name *"
                    htmlFor="unit_name"
                    error={errors.unit_name}
                  >
                    <Input
                      id="unit_name"
                      value={data.unit_name}
                      onChange={(e) => setData("unit_name", e.target.value)}
                    />
                  </Row>
                  <Row
                    label="Price / Unit *"
                    htmlFor="price"
                    error={errors.price}
                  >
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={data.price}
                      onChange={(e) => setData("price", e.target.value)}
                    />
                  </Row>
                </>
              )}

              <Hint>
                {isPerUnit
                  ? "Total is calculated at checkout based on quantity."
                  : "Price shown to the guest at selection time."}
              </Hint>
            </div>
          )}

          {(isSelectable || isMulti) && (
            <div className="space-y-3">
              {data.options.map((option, index) => (
                <OptionBlock
                  key={index}
                  mode={mode}
                  index={index}
                  option={option}
                  totalOptions={data.options.length}
                  updateOption={updateOption}
                  removeOption={removeOption}
                  loadingImagesForEdit={loadingImagesForEdit}
                  existingOptionImagesByKey={existingOptionImagesByKey}
                  newOptionImagePreviews={newOptionImagePreviews}
                  handleReplaceOptionImageSafe={handleReplaceOptionImageSafe} // UPDATED
                  optionImageErrors={optionImageErrors}                      // NEW
                />
              ))}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Option
                </Button>
              </div>

              {errors.options && (
                <p className="text-red-500 text-xs mt-1 text-right">
                  {errors.options}
                </p>
              )}
            </div>
          )}

          {isFree && (
            <Hint>Complimentary service — price is fixed to 0.</Hint>
          )}
        </Box>

        {/* CUSTOM QUESTIONS */}
        <Box
          title="Custom Questions"
          subtitle="Ask guest-specific questions during ordering (optional)."
          bodyClassName="max-h-[32vh]"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHasQuestions((v) => !v)}
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-muted"
                role="switch"
                aria-checked={hasQuestions}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${
                    hasQuestions ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm">Enable custom questions</span>
              <div className="ml-2 group relative">
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute hidden group-hover:block z-10 w-64 p-2 mt-1 text-xs bg-black text-white rounded-md shadow-lg">
                  Customers will be asked these questions during checkout.
                </div>
              </div>
            </div>

            {hasQuestions && (
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder={`Question ${index + 1}`}
                      value={question}
                      onChange={(e) =>
                        updateQuestionLocal(index, e.target.value)
                      }
                      className="col-span-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestionLocal(index)}
                      disabled={questions.length <= 1}
                      className="col-span-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestionLocal}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Question
                  </Button>
                </div>

                {errors.questions && (
                  <p className="text-red-500 text-xs mt-1 text-right">
                    {errors.questions}
                  </p>
                )}
              </div>
            )}
          </div>
        </Box>
      </div>
    </div>
  );
}
