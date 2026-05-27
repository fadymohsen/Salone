"use client";

import { useRouter } from "next/navigation";

export default function LogoutBtn() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-bold text-glam-text/50 hover:text-primary transition-colors"
    >
      Log out
    </button>
  );
}
