"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Hash, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

const INPUT = "w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm text-glam-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150";

type Step = "request" | "verify" | "reset" | "done";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setStep("verify");
      else setError("Could not send reset email. Check your email address.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.valid) setStep("reset");
      else setError(data.error ?? "Invalid code.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) setStep("done");
      else setError(data.error ?? "Reset failed.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-green-500" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-glam-text mb-2">Password updated!</h2>
          <p className="text-sm text-muted mb-6">You can now sign in with your new password.</p>
          <Link href="/account/login"
            className="inline-flex items-center justify-center bg-primary text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-secondary transition-colors duration-200 cursor-pointer">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["request", "verify", "reset"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${
                step === s ? "bg-primary text-white" :
                (["request","verify","reset"].indexOf(step) > i) ? "bg-green-500 text-white" :
                "bg-border text-muted"
              }`}>{i + 1}</div>
              {i < 2 && <div className={`w-8 h-px ${(["request","verify","reset"].indexOf(step) > i) ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-bold text-glam-text mb-1">
            {step === "request" && "Reset password"}
            {step === "verify" && "Enter your code"}
            {step === "reset" && "New password"}
          </h1>
          <p className="text-sm text-muted">
            {step === "request" && "Enter your email and we'll send a reset code."}
            {step === "verify" && `We sent a 6-digit code to ${email}`}
            {step === "reset" && "Choose a strong new password."}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-7 border border-border shadow-sm shadow-primary/5">
          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-glam-text mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`${INPUT} pl-10`} placeholder="you@example.com" />
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 min-h-[52px] cursor-pointer">
                {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Sending…</> : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerify} className="space-y-4" noValidate>
              <div>
                <label htmlFor="code" className="block text-xs font-semibold text-glam-text mb-1.5">6-Digit Code</label>
                <div className="relative">
                  <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input id="code" type="text" required inputMode="numeric" maxLength={6} value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={`${INPUT} pl-10 text-center tracking-widest font-bold text-lg`} placeholder="000000" />
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading || code.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 min-h-[52px] cursor-pointer">
                {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Verifying…</> : "Verify Code"}
              </button>
              <button type="button" onClick={() => setStep("request")} className="w-full text-xs text-muted hover:text-primary transition-colors duration-150 cursor-pointer py-2">
                Resend code
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <div>
                <label htmlFor="newpw" className="block text-xs font-semibold text-glam-text mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input id="newpw" type={showPw ? "text" : "password"} required minLength={8} autoComplete="new-password"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className={`${INPUT} pl-10 pr-12`} placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors duration-150 cursor-pointer"
                    aria-label={showPw ? "Hide" : "Show"}>
                    {showPw ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 min-h-[52px] cursor-pointer">
                {loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Updating…</> : "Update Password"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-xs text-muted">
            <Link href="/account/login" className="hover:text-primary transition-colors duration-150 cursor-pointer">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
