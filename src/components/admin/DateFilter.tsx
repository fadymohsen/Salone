"use client";

import { useRouter } from "next/navigation";

export default function DateFilter({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => router.push(`/admin?date=${e.target.value}`)}
      className="bg-white border border-pastel-pink rounded-2xl px-4 py-3 text-sm font-medium text-glam-text focus:outline-none focus:border-primary transition-all"
    />
  );
}
