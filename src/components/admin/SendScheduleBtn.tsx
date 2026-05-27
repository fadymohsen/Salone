"use client";

import { useState } from "react";

export default function SendScheduleBtn({ tomorrowDate }: { tomorrowDate: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSend = async () => {
    setStatus("sending");
    try {
      const res = await fetch("/api/cron/send-schedule");
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 4000);
  };

  const labels = {
    idle: `Send Tomorrow's Schedule (${tomorrowDate}) 📧`,
    sending: "Sending...",
    done: "Sent! Check your inbox ✅",
    error: "Failed — check SMTP settings ❌",
  };

  return (
    <button
      onClick={handleSend}
      disabled={status === "sending"}
      className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-md ${
        status === "done"
          ? "bg-green-500 text-white"
          : status === "error"
          ? "bg-red-400 text-white"
          : "bg-pastel-pink text-primary hover:bg-primary hover:text-white shadow-primary/10"
      } disabled:opacity-50`}
    >
      {labels[status]}
    </button>
  );
}
