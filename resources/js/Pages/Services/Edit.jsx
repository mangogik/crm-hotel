import { useState, useEffect, useMemo } from "react";
// 1. Import 'router' global
import { useForm, Head, Link, router } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ServiceForm from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditService({ service, categories }) {
    // ===== BASE FORM DATA (Inertia) =====
    // Initialize form data with service options
    const { data, setData, processing, errors } = useForm({
        name: service.name || "",
        description: service.description || "",
        type: service.type || "fixed",
        category_id: service.category_id || null,
        fulfillment_type: service.fulfillment_type || "direct",
        offering_session: service.offering_session || "post_checkin",
        price: service.price || "",
        unit_name: service.unit_name || "",
        // Ensure we preserve the original option keys
        options: service.options && service.options.length > 0
            ? service.options.map(opt => ({
                key: opt.key, // Preserve the original key
                name: opt.name,
                price: opt.price
            }))
            : [{ name: "", price: "" }],
        has_questions: service.has_active_questions || false,
        questions: service.active_question?.questions_json || [""],
    });

    // ===== IMAGE STATE =====
    const [loadingImagesForEdit, setLoadingImagesForEdit] = useState(true);

    // Use useMemo to compute existingOptionImagesByKey directly from service prop
const existingOptionImagesByKey = useMemo(() => {
    const grouped = {};
    const imgs = service.optionImages || service.option_images || [];
    if (Array.isArray(imgs)) {
        imgs.forEach((img) => {
            const key = img.option_key || "unknown";
            if (!grouped[key]) grouped[key] = [];
            // Pastikan URL bisa diakses
            grouped[key].push({
                ...img,
                url: img.url || `/storage/${img.image_path}`,
            });
        });
    }
    return grouped;
}, [service.option_images]);


    const existingGeneralImages = useMemo(() => {
        return service.images || [];
    }, [service.images]);

    // track deletions for UPDATE
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [optionImagesToDelete, setOptionImagesToDelete] = useState([]);

    // newly added general images (unsaved yet)
    const [newGeneralImages, setNewGeneralImages] = useState([]); // [File,...]
    const [newGeneralPreviews, setNewGeneralPreviews] = useState([]); // [{file, url}]

    // newly picked per-option image file (replacement, 1 each)
    const [newOptionImages, setNewOptionImages] = useState({}); // { [optionKey]: File }
    const [newOptionImagePreviews, setNewOptionImagePreviews] = useState({}); // { [optionKey]: objectURL }

    // questions initial (for edit, so the toggle starts correct)
    const [initialHasQuestions] = useState(
        service.has_active_questions || false
    );
    const [initialQuestions] = useState(
        service.active_question?.questions_json || [""]
    );

    // Set loading to false after component mounts
    useEffect(() => {
        setLoadingImagesForEdit(false);
    }, []);

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

    // ===== IMAGE HANDLERS =====

    // remove existing (DB) general image during EDIT
    const markDeleteGeneralImage = (imgId) => {
        setExistingGeneralImages((prev) =>
            prev.filter((img) => img.id !== imgId)
        );
        setImagesToDelete((prev) => [...prev, imgId]);
    };

    // optional helper for per-option existing images
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
        setNewGeneralImages((prev) => prev.filter((_, i) => i !== idxToRemove));
    };

    // user picks new per-option image
    const handleReplaceOptionImage = (optionKey, fileList) => {
        const file = fileList?.[0];
        if (!file) return;

        setNewOptionImages((prev) => ({ ...prev, [optionKey]: file }));
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

    // ===== BUILD FORMDATA =====
    const buildFormDataFromState = () => {
        const fd = new FormData();

        fd.append("_method", "PUT"); // Penting untuk update

        fd.append("name", data.name ?? "");
        fd.append("description", data.description ?? "");
        fd.append("type", data.type ?? "");
        fd.append("category_id", data.category_id ?? "");
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

        // deletions
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
            // match ServiceController@update -> option_images_new
            fd.append(`option_images_new[${optionKey}]`, file);
        });

        return fd;
    };

    // ===== SUBMIT UPDATE =====
    const handleUpdate = (e) => {
        e.preventDefault();
        const fd = buildFormDataFromState();

        // Ganti 'post' (dari useForm) menjadi 'router.post' (global)
        router.post(route("services.update", service.id), fd, {
            forceFormData: true,
            onSuccess: () => {
                // Halaman akan auto-redirect
            },
            onError: () => {
                // Biarkan modal tetap terbuka untuk menampilkan error
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit Service: ${service.name}`} />
            <div className="container mx-auto py-2 px-4">
                <form onSubmit={handleUpdate}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Edit Service</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Link href={route("services.index")}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? "Saving..."
                                        : "Update Service"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ServiceForm
                                mode="edit"
                                data={data}
                                setData={setData}
                                categories={categories || []}
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
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}