import OrdersManager from "@/components/admin/OrdersManager";

export default function OrdersPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-glam-text">Orders</h1>
        <p className="text-sm text-glam-text/50 mt-0.5">Search, filter, and manage all bookings</p>
      </div>
      <OrdersManager />
    </div>
  );
}
