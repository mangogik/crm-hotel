import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function Customers() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Customers</h1>
      <p>Ini Halaman Customers.</p>
    </div>
  )
}

Customers.layout = (page) => <AuthenticatedLayout children={page} />;