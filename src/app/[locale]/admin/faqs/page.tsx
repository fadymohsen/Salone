import FaqManager from "@/components/admin/FaqManager";

export default function FaqsPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">FAQs</h1>
        <p className="text-sm text-muted mt-0.5">Manage frequently asked questions on the homepage</p>
      </div>
      <FaqManager />
    </div>
  );
}
