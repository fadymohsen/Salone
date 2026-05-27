"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/lib/i18n/DictionaryContext";
import { useLocale } from "@/lib/i18n/LocaleContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useDictionary();
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(`/${locale}/admin`);
        router.refresh();
      } else {
        setError(t.admin.login.wrongPassword);
      }
    } catch {
      setError(t.admin.login.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl border border-pastel-pink">
        <div className="text-center mb-8">
          <span className="text-3xl font-black text-primary">{t.admin.login.title}</span>
          <p className="text-sm text-glam-text/60 mt-1">{t.admin.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-glam-text/80 mb-1">
              {t.admin.login.password}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-pastel-pink rounded-2xl p-3 text-sm focus:outline-none focus:border-primary transition-all"
              placeholder={t.admin.login.placeholder}
            />
          </div>

          {error && (
            <p className="text-xs text-primary font-medium text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/20 hover:bg-secondary transition-all disabled:opacity-50"
          >
            {loading ? t.admin.login.checking : t.admin.login.enter}
          </button>
        </form>
      </div>
    </div>
  );
}
