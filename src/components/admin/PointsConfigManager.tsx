"use client";

import { useState, useEffect } from "react";
import { Star, Save, Loader2, Info, Zap, Gift } from "lucide-react";

type Config = {
  id: string;
  pointsPerBooking: number;
  pointsThreshold: number;
  couponDiscount: number;
};

const INPUT_CLS =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function PointsConfigManager() {
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState({ pointsPerBooking: "", pointsThreshold: "", couponDiscount: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/points-config")
      .then((r) => r.json())
      .then((data: Config) => {
        setConfig(data);
        setForm({
          pointsPerBooking: String(data.pointsPerBooking),
          pointsThreshold: String(data.pointsThreshold),
          couponDiscount: String(data.couponDiscount),
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/points-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pointsPerBooking: Number(form.pointsPerBooking),
        pointsThreshold: Number(form.pointsThreshold),
        couponDiscount: Number(form.couponDiscount),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data: Config = await res.json();
      setConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted text-sm">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
      </div>
    );
  }

  const pts = Number(form.pointsPerBooking) || 0;
  const threshold = Number(form.pointsThreshold) || 0;
  const discount = Number(form.couponDiscount) || 0;
  const bookingsNeeded = pts > 0 ? Math.ceil(threshold / pts) : 0;

  return (
    <div className="space-y-6">
      {/* How it works summary card */}
      <div className="bg-pastel-pink/40 border border-primary/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold text-glam-text">How the Points System Works</p>
        </div>
        <ol className="space-y-1.5 text-sm text-muted list-none">
          <li className="flex items-start gap-2">
            <Zap size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            Client completes and pays for a booking → earns <strong className="text-glam-text">{pts} point{pts !== 1 ? "s" : ""}</strong>
          </li>
          <li className="flex items-start gap-2">
            <Star size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            After accumulating <strong className="text-glam-text">{threshold} points</strong> ({bookingsNeeded > 0 ? `≈${bookingsNeeded} booking${bookingsNeeded !== 1 ? "s" : ""}` : "—"}), a coupon is automatically generated
          </li>
          <li className="flex items-start gap-2">
            <Gift size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            The auto-generated coupon gives <strong className="text-glam-text">{discount}% off</strong> their next booking
          </li>
        </ol>
      </div>

      {/* Config form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
          <Star size={16} className="text-primary" aria-hidden="true" />
          Points Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="pts-per-booking" className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Points per Booking
            </label>
            <input
              id="pts-per-booking"
              type="number"
              min="1"
              required
              value={form.pointsPerBooking}
              onChange={(e) => setForm({ ...form, pointsPerBooking: e.target.value })}
              className={INPUT_CLS}
            />
            <p className="text-xs text-muted mt-1">Awarded when a booking is marked completed</p>
          </div>

          <div>
            <label htmlFor="pts-threshold" className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Points to Earn Coupon
            </label>
            <input
              id="pts-threshold"
              type="number"
              min="1"
              required
              value={form.pointsThreshold}
              onChange={(e) => setForm({ ...form, pointsThreshold: e.target.value })}
              className={INPUT_CLS}
            />
            <p className="text-xs text-muted mt-1">Total points needed to auto-generate a coupon</p>
          </div>

          <div>
            <label htmlFor="coupon-discount" className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Auto-Coupon Discount %
            </label>
            <input
              id="coupon-discount"
              type="number"
              min="1"
              max="100"
              required
              value={form.couponDiscount}
              onChange={(e) => setForm({ ...form, couponDiscount: e.target.value })}
              className={INPUT_CLS}
            />
            <p className="text-xs text-muted mt-1">Discount applied when auto-coupon is redeemed</p>
          </div>
        </div>

        {/* Live preview */}
        {pts > 0 && threshold > 0 && discount > 0 && (
          <div className="bg-background rounded-xl p-3 text-xs text-muted border border-border">
            <span className="font-bold text-glam-text">Preview: </span>
            A client who completes {bookingsNeeded} booking{bookingsNeeded !== 1 ? "s" : ""} will earn {threshold} points and receive a coupon for {discount}% off.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-secondary transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm shadow-primary/20 min-h-[44px]"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving…</>
          ) : saved ? (
            <><Save size={14} aria-hidden="true" /> Saved!</>
          ) : (
            <><Save size={14} aria-hidden="true" /> Save Configuration</>
          )}
        </button>
      </form>

      {/* Link to promos */}
      <div className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-glam-text">Manual Coupons</p>
          <p className="text-xs text-muted mt-0.5">Create, manage, and toggle promo codes manually from the Promos page.</p>
        </div>
        <a
          href="/admin/promos"
          className="flex items-center gap-1.5 bg-pastel-pink text-primary font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer shrink-0 min-h-[44px]"
        >
          <Gift size={14} aria-hidden="true" />
          Go to Promos
        </a>
      </div>
    </div>
  );
}
