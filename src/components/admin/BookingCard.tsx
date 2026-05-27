"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking } from "@prisma/client";

export default function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Cancel ${booking.clientName}'s appointment?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
      else alert("Could not delete booking.");
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-pastel-pink p-4 flex items-start gap-4">
      {/* Time badge */}
      <div className="bg-pastel-pink text-primary font-black text-sm rounded-xl px-3 py-2 shrink-0">
        {booking.bookingTime}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-glam-text text-sm truncate">{booking.clientName}</p>
        <p className="text-xs text-glam-text/60 mt-0.5">{booking.serviceType}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-glam-text/70">{booking.clientPhone}</span>
          {booking.clientEmail && (
            <span className="text-xs text-primary">{booking.clientEmail}</span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-bold text-glam-text/40 hover:text-primary transition-colors disabled:opacity-30 shrink-0 pt-0.5"
        aria-label="Delete booking"
      >
        {deleting ? "..." : "✕"}
      </button>
    </div>
  );
}
