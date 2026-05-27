"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Phone, Loader2, Eye, EyeOff } from "lucide-react";

const INPUT = "w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm text-glam-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/account/dashboard";
      } else {
        setError(data.error ?? "Registration failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold text-glam-text mb-1">Create your account</h1>
          <p className="text-sm text-muted">Join GlowBook and manage your beauty appointments</p>
        </div>

        <div className="bg-white rounded-3xl p-7 border border-border shadow-sm shadow-primary/5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-glam-text mb-1.5">Full Name <span className="text-primary" aria-hidden="true">*</span></label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="name" type="text" required autoComplete="name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`${INPUT} pl-10`} placeholder="Farida Amin" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-glam-text mb-1.5">Email <span className="text-primary" aria-hidden="true">*</span></label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="email" type="email" required autoComplete="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`${INPUT} pl-10`} placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-glam-text mb-1.5">Phone <span className="text-muted font-normal">(optional)</span></label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="phone" type="tel" autoComplete="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`${INPUT} pl-10`} placeholder="010XXXXXXXX" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-glam-text mb-1.5">Password <span className="text-primary" aria-hidden="true">*</span></label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="password" type={showPw ? "text" : "password"} required autoComplete="new-password" minLength={8}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${INPUT} pl-10 pr-12`} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors duration-150 cursor-pointer"
                  aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                </button>
              </div>
              <p className="text-xs text-muted mt-1 pl-1">At least 8 characters</p>
            </div>

            {error && (
              <p role="alert" className="text-xs text-red-500 font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] cursor-pointer active:scale-[0.98]">
              {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Creating account…</> : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href="/account/login" className="text-primary font-semibold hover:underline cursor-pointer">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
