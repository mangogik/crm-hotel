import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

export default function History() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">History</h1>
      <p>Ini Halaman History.</p>
    </div>
  )
}

History.layout = (page) => <AuthenticatedLayout children={page} />;