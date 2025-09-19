import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout"

export default function Services() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Services</h1>
      <p>Ini Halaman Services.</p>
    </div>
  )
}

Services.layout = (page) => <AuthenticatedLayout children={page} />;