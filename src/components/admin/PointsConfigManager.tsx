"use client";

import { useState, useEffect } from "react";
import { Star, Save, Loader2, Info, Zap, Gift, Percent, Check } from "lucide-react";

type Config = {
  id: string;
  pointsPerBooking: number;
  pointsThreshold: number;
  couponDiscount: number;
};

type Service = {
  id: string;
  name: string;
  nameAr: string | null;
  price: number;
  rewardDiscount: number | null;
  pointsPrice: number | null;
};

const INPUT_CLS =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function PointsConfigManager() {
  const [config, setConfig] = useState<Config | null>(null);
  const [form, setForm] = useState({ pointsThreshold: "", couponDiscount: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/points-config").then(r => r.json()),
      fetch("/api/admin/services").then(r => r.json()),
    ]).then(([cfgData, svcData]) => {
      setConfig(cfgData);
      setForm({
        pointsThreshold: String(cfgData.pointsThreshold),
        couponDiscount: String(cfgData.couponDiscount),
      });
      setServices(Array.isArray(svcData) ? svcData : []);
      setLoading(false);
    });
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/admin/points-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pointsPerBooking: 1, // 1 EGP = 1 point, but this field is kept for compatibility
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

  const handleToggleReward = async (service: Service, discount: number | null) => {
    setSavingId(service.id);
    const pointsPrice = discount != null ? Math.round(service.price * discount / 100) : null;
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...service, rewardDiscount: discount, pointsPrice }),
    });
    if (res.ok) {
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, rewardDiscount: discount, pointsPrice } : s));
      showToast(discount != null ? `${service.name} added to rewards (${discount}% off for ${pointsPrice} pts)` : `${service.name} removed from rewards`);
    }
    setSavingId(null);
  };

  const handleDiscountChange = async (service: Service, discountStr: string) => {
    const discount = parseInt(discountStr, 10);
    if (isNaN(discount) || discount < 1 || discount > 100) return;
    await handleToggleReward(service, discount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted text-sm">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading...
      </div>
    );
  }

  const threshold = Number(form.pointsThreshold) || 0;
  const discount = Number(form.couponDiscount) || 0;
  const rewardServices = services.filter(s => s.rewardDiscount != null);
  const nonRewardServices = services.filter(s => s.rewardDiscount == null);

  return (
    <div className="space-y-6">
      {/* How it works */}
      <div className="bg-pastel-pink/40 border border-primary/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-primary shrink-0" aria-hidden="true" />
          <p className="text-sm font-bold text-glam-text">How the Loyalty Program Works</p>
        </div>
        <ol className="space-y-1.5 text-sm text-muted list-none">
          <li className="flex items-start gap-2">
            <Zap size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            Every <strong className="text-glam-text">1 EGP</strong> paid = <strong className="text-glam-text">1 point</strong> earned automatically
          </li>
          <li className="flex items-start gap-2">
            <Star size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            {threshold > 0
              ? <>After reaching <strong className="text-glam-text">{threshold} points</strong>, an auto-coupon for <strong className="text-glam-text">{discount}% off</strong> is generated</>
              : <>Auto-coupon is <strong className="text-glam-text">disabled</strong> — set a points threshold above to enable it</>
            }
          </li>
          <li className="flex items-start gap-2">
            <Gift size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            You can also select specific services below as <strong className="text-glam-text">redeemable rewards</strong> with a custom discount %
          </li>
        </ol>
      </div>

      {/* Auto-Coupon Config */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
          <Star size={16} className="text-primary" aria-hidden="true" />
          Auto-Coupon Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pts-threshold" className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Points Needed for Auto-Coupon <span className="text-muted font-normal">(optional — leave 0 to disable)</span>
            </label>
            <input
              id="pts-threshold"
              type="number"
              min="0"
              value={form.pointsThreshold}
              onChange={(e) => setForm({ ...form, pointsThreshold: e.target.value })}
              className={INPUT_CLS}
            />
            <p className="text-xs text-muted mt-1">e.g., 500 = spend 500 EGP total to earn a coupon. Set 0 to disable auto-coupons.</p>
          </div>
          <div>
            <label htmlFor="coupon-discount" className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Auto-Coupon Discount %
            </label>
            <input
              id="coupon-discount"
              type="number"
              min="0"
              max="100"
              value={form.couponDiscount}
              onChange={(e) => setForm({ ...form, couponDiscount: e.target.value })}
              disabled={!Number(form.pointsThreshold)}
              className={`${INPUT_CLS} disabled:opacity-50`}
            />
            <p className="text-xs text-muted mt-1">Discount % on the auto-generated coupon</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-secondary transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm shadow-primary/20 min-h-[44px]"
        >
          {saving ? (
            <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving...</>
          ) : saved ? (
            <><Check size={14} aria-hidden="true" /> Saved!</>
          ) : (
            <><Save size={14} aria-hidden="true" /> Save Settings</>
          )}
        </button>
      </form>

      {/* Service Rewards */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
            <Gift size={16} className="text-primary" aria-hidden="true" />
            Service Rewards
          </h2>
          <p className="text-xs text-muted mt-1">Select services to include in the loyalty program and set the discount %. Users redeem points equal to the discounted amount.</p>
        </div>

        {/* Currently in rewards */}
        {rewardServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">In Rewards Program</p>
            {rewardServices.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-glam-text truncate">{s.name}</p>
                  <p className="text-xs text-muted">{s.price} EGP · {s.rewardDiscount}% off · <strong className="text-primary">{s.pointsPrice} pts</strong> to redeem</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={s.rewardDiscount ?? ""}
                      onChange={(e) => {
                        // Optimistic local update
                        const val = e.target.value;
                        setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, rewardDiscount: val ? parseInt(val, 10) : null } : sv));
                      }}
                      onBlur={(e) => handleDiscountChange(s, e.target.value)}
                      className="w-16 bg-white border border-border rounded-lg px-2 py-1.5 text-xs text-center font-bold focus:outline-none focus:border-primary"
                    />
                    <Percent size={12} className="text-muted" aria-hidden="true" />
                  </div>
                  <button
                    onClick={() => handleToggleReward(s, null)}
                    disabled={savingId === s.id}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1"
                  >
                    {savingId === s.id ? <Loader2 size={12} className="animate-spin" /> : "Remove"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available to add */}
        {nonRewardServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted uppercase tracking-wide">Available Services</p>
            {nonRewardServices.map(s => (
              <div key={s.id} className="flex items-center gap-3 bg-background border border-border rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-glam-text truncate">{s.name}</p>
                  <p className="text-xs text-muted">{s.price} EGP</p>
                </div>
                <button
                  onClick={() => handleToggleReward(s, 50)}
                  disabled={savingId === s.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary bg-pastel-pink px-3 py-2 rounded-xl hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer shrink-0"
                >
                  {savingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <><Gift size={12} aria-hidden="true" /> Add to Rewards</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-3 bg-glam-text text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/20 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Gift size={14} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium">{toast}</p>
          </div>
        </div>
      )}
    </div>
  );
}
