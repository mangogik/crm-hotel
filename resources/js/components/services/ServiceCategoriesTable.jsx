import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useForm, usePage } from "@inertiajs/react";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import ServiceCategoryForm from "./ServiceCategoryForm";
import { toast } from "sonner";

const ServiceCategoriesTable = ({ categories }) => {
    const { flash } = usePage().props;
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Form state for creating a new category
    const {
        data: createData,
        setData: setCreateData,
        errors: createErrors,
        post,
        processing: createProcessing,
        reset: resetCreate,
        clearErrors: clearCreateErrors,
    } = useForm({
        name: "",
        slug: "",
        description: "",
    });

    // Form state for editing a category
    const {
        data: editData,
        setData: setEditData,
        errors: editErrors,
        put,
        processing: editProcessing,
        reset: resetEdit,
        clearErrors: clearEditErrors,
    } = useForm({
        name: "",
        slug: "",
        description: "",
    });

    // Form state for deleting a category
    const { delete: destroyCategory, processing: deleteProcessing } = useForm();

    // Initialize form when editing
    const handleEdit = (category) => {
        setEditing(category);
        setEditData({
            name: category.name,
            slug: category.slug,
            description: category.description || "",
        });
    };

    // Handle form submission for creating a new category
    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post(route("service-categories.store"), {
            onSuccess: () => {
                setCreating(false);
                resetCreate();
                clearCreateErrors();
                toast.success("Category created successfully");
            },
            onError: (errors) => {
                toast.error("Failed to create category");
            },
        });
    };

    // Handle form submission for editing a category
    const handleEditSubmit = (e) => {
        e.preventDefault();
        put(route("service-categories.update", editing.id), {
            onSuccess: () => {
                setEditing(null);
                resetEdit();
                clearEditErrors();
                toast.success("Category updated successfully");
            },
            onError: (errors) => {
                toast.error("Failed to update category");
            },
        });
    };

    // Handle delete confirmation
    const handleDelete = (category) => {
        setDeleting(category);
    };

    const confirmDelete = () => {
        if (deleting) {
            destroyCategory(route("service-categories.destroy", deleting.id), {
                onSuccess: () => {
                    setDeleting(null);
                    toast.success("Category deleted successfully");
                },
                onError: () => {
                    toast.error("Failed to delete category");
                },
            });
        }
    };

    // Show flash messages
    React.useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
        if (flash.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <Card className="mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">
                    Service Categories
                </CardTitle>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
            </CardHeader>

            <CardContent>
                <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium">
                                    Name
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                    Description
                                </th>
                                <th className="text-left py-3 px-4 font-medium">
                                    Services
                                </th>
                                <th className="text-right py-3 px-4 font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((c) => (
                                <tr
                                    key={c.id}
                                    className="border-b hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-3 px-4 font-medium">
                                        {c.name}
                                    </td>
                                    <td className="py-3 px-4">
                                        {c.description || "-"}
                                    </td>
                                    <td className="py-3 px-4">
                                        {/* <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                                            {c.services_count || 0} services
                                        </div> */}
                                        <Badge
                                            variant="outline"
                                            className="ml-auto border-blue-200 bg-blue-100 text-blue-800 text-xs"
                                        >
                                            {c.services_count || 0} Services
                                        </Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(c)}
                                                className="bg-secondary text-secondary-foreground"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(c)}
                                                className="bg-destructive text-destructive-foreground"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {categories.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No service categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>

            {/* Create Dialog */}
            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Service Category</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit}>
                        <ServiceCategoryForm
                            data={createData}
                            setData={setCreateData}
                            errors={createErrors}
                        />
                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreating(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createProcessing}>
                                {createProcessing
                                    ? "Creating..."
                                    : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Service Category</DialogTitle>
                    </DialogHeader>
                    {editing && (
                        <form onSubmit={handleEditSubmit}>
                            <ServiceCategoryForm
                                data={editData}
                                setData={setEditData}
                                errors={editErrors}
                            />
                            <DialogFooter className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditing(null)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editProcessing}>
                                    {editProcessing
                                        ? "Saving..."
                                        : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            Are you sure you want to delete "{deleting?.name}"?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleting(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteProcessing}
                        >
                            {deleteProcessing ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default ServiceCategoriesTable;
