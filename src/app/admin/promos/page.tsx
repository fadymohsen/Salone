import PromoManager from "@/components/admin/PromoManager";

export default function PromosPage() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-glam-text">Promo Codes</h1>
        <p className="text-sm text-glam-text/50 mt-0.5">Generate and manage discount codes</p>
      </div>
      <PromoManager />
    </div>
  );
}
