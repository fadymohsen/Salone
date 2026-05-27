import PointsConfigManager from "@/components/admin/PointsConfigManager";

export default function PointsPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-glam-text">Points & Rewards</h1>
        <p className="text-sm text-muted mt-0.5">Configure how clients earn points and auto-generated coupons</p>
      </div>
      <PointsConfigManager />
    </div>
  );
}
