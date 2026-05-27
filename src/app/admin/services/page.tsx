import ServiceManager from "@/components/admin/ServiceManager";

export default function ServicesPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">Services</h1>
        <p className="text-sm text-muted mt-0.5">Add, edit, and manage your service menu and pricing</p>
      </div>
      <ServiceManager />
    </div>
  );
}
