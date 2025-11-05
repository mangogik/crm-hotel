import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ServiceForm from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateService({ categories }) {
    // ===== BASE FORM DATA (Inertia) =====
    const { data, setData, post, processing, errors } = useForm({
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
        category_id: null,
    });

    // ===== IMAGE STATE =====
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

    // ===== BUILD FORMDATA =====
    const buildFormDataFromState = () => {
        const fd = new FormData();

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

        // new general uploads
        newGeneralImages.forEach((file, idx) => {
            if (file) {
                fd.append(`images[${idx}]`, file);
            }
        });

        // per-option uploads
        Object.entries(newOptionImages).forEach(([optionKey, file]) => {
            if (!file) return;
            // match ServiceController@store -> option_images
            fd.append(`option_images[${optionKey}]`, file);
        });

        return fd;
    };

    // ===== SUBMIT CREATE =====
    const handleCreate = (e) => {
        e.preventDefault();
        const fd = buildFormDataFromState();

        post(route("services.store"), {
            data: fd,
            forceFormData: true,
            onSuccess: () => {
                // Halaman akan auto-redirect
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create New Service" />
            <div className="container mx-auto py-2 px-4">
                <form onSubmit={handleCreate}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Create New Service</CardTitle>
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
                                        : "Create Service"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ServiceForm
                                mode="create"
                                data={data}
                                setData={setData}
                                categories={categories || []}
                                errors={errors}
                                addOption={addOption}
                                removeOption={removeOption}
                                updateOption={updateOption}
                                initialHasQuestions={false}
                                initialQuestions={[""]}
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
                                setNewOptionImagePreviews={
                                    setNewOptionImagePreviews
                                }
                                handleReplaceOptionImage={
                                    handleReplaceOptionImage
                                }
                                addNewGeneralImages={addNewGeneralImages}
                                removeNewGeneralPreview={
                                    removeNewGeneralPreview
                                }
                                loadingImagesForEdit={false}
                            />
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}