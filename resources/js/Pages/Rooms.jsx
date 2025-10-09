// resources/js/Pages/Rooms.jsx
import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import RoomHeader from "@/components/rooms/RoomHeader";
import RoomFilters from "@/components/rooms/RoomFilters";
import RoomsTable from "@/components/rooms/RoomsTable";
import RoomForm from "@/components/rooms/RoomForm";
import DeleteRoomModal from "@/components/rooms/DeleteRoomModal";
import Pagination from "@/components/rooms/Pagination";

export default function Rooms() {
    const { rooms, filters, flash } = usePage().props;

    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "all");
    const [selectedType, setSelectedType] = useState(filters.room_type || "all");
    const [sortBy, setSortBy] = useState(filters.sort_by || "room_number");
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || "asc");
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [currentRoom, setCurrentRoom] = useState(null);
    const [expandedRows, setExpandedRows] = useState([]);
    const [isBulkMode, setIsBulkMode] = useState(false); // Track if we're in bulk mode

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(() => applyFilters(1), 500);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedStatus, selectedType, sortBy, sortDirection]);

    const applyFilters = (page = filters.page || 1) => {
        router.get(route("rooms.index"), {
            search: searchTerm,
            status: selectedStatus === "all" ? "" : selectedStatus,
            room_type: selectedType === "all" ? "" : selectedType,
            sort_by: sortBy,
            sort_direction: sortDirection,
            page,
        }, { preserveState: true, replace: true });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortDirection("asc");
        }
    };
    
    const openCreateModal = () => {
        setIsBulkMode(false); // Reset to single mode when opening
        setIsCreateModalOpen(true);
    };

    const openEditModal = (room) => {
        setCurrentRoom(room);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (room) => {
        setCurrentRoom(room);
        setIsDeleteModalOpen(true);
    };
    
    const handleCreateSuccess = () => {
        setIsCreateModalOpen(false);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setCurrentRoom(null);
    };

    const handleDelete = () => {
        router.delete(route("rooms.destroy", currentRoom.id), { 
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setCurrentRoom(null);
            }
        });
    };
    
    const clearFilters = () => {
        setSearchTerm("");
        setSelectedStatus("all");
        setSelectedType("all");
        setSortBy("room_number");
        setSortDirection("asc");
    };

    const toggleRow = (id) => setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    
    const buildPaginationUrl = (url) => {
        if (!url) return null;
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        params.set("search", searchTerm);
        params.set("status", selectedStatus === "all" ? "" : selectedStatus);
        params.set("room_type", selectedType === "all" ? "" : selectedType);
        params.set("sort_by", sortBy);
        params.set("sort_direction", sortDirection);
        return `${urlObj.pathname}?${params.toString()}`;
    };

    // Handle mode change from RoomForm
    const handleModeChange = (isRangeMode) => {
        setIsBulkMode(isRangeMode);
    };

    return (
        <div className="container mx-auto py-2 px-4">
            <Card className="mb-8">
                <RoomHeader onAddRoom={openCreateModal} />
                <CardContent>
                    <RoomFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
                        selectedType={selectedType} setSelectedType={setSelectedType}
                        clearFilters={clearFilters}
                    />
                    <RoomsTable
                        rooms={rooms.data}
                        expandedRows={expandedRows} toggleRow={toggleRow}
                        openEditModal={openEditModal} openDeleteModal={openDeleteModal}
                        sortBy={sortBy} sortDirection={sortDirection} handleSort={handleSort}
                    />
                    <Pagination paginationData={rooms} buildPaginationUrl={buildPaginationUrl} router={router} />
                </CardContent>
            </Card>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className={`${isBulkMode ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} max-h-[90vh] overflow-y-auto`}>
                    <DialogHeader>
                        <DialogTitle>Create New Room</DialogTitle>
                        <DialogDescription>
                            Add a new room to the hotel. You can create a single room or a range of rooms at once.
                        </DialogDescription>
                    </DialogHeader>
                    <RoomForm 
                        onSuccess={handleCreateSuccess}
                        onCancel={() => setIsCreateModalOpen(false)}
                        onModeChange={handleModeChange}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Room</DialogTitle>
                        <DialogDescription>
                            Update the room details. Note: You cannot edit a range of rooms at once.
                        </DialogDescription>
                    </DialogHeader>
                    <RoomForm 
                        initialData={currentRoom}
                        onSuccess={handleEditSuccess}
                        onCancel={() => {
                            setIsEditModalOpen(false);
                            setCurrentRoom(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            <DeleteRoomModal 
                isOpen={isDeleteModalOpen} 
                onOpenChange={setIsDeleteModalOpen} 
                onConfirm={handleDelete} 
                room={currentRoom} 
            />
        </div>
    );
}

Rooms.layout = (page) => <AuthenticatedLayout children={page} />;