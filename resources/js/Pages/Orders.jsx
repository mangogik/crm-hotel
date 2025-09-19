import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Orders() {
    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Orders</h1>
            <p>Ini Halaman Orders</p>
        </div>
    );
}

Orders.layout = (page) => <AuthenticatedLayout children={page} />;
