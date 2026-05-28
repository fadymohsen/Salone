"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, Info, Zap, Gift, Percent } from "lucide-react";

type Config = {
  id: string;
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
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch("/api/admin/services").then(r => r.json()).then(svcData => {
      setServices(Array.isArray(svcData) ? svcData : []);
      setLoading(false);
    });
  }, []);

  const handleToggleReward = async (service: Service, discount: number | null, points: number | null) => {
    setSavingId(service.id);
    const res = await fetch(`/api/admin/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...service, rewardDiscount: discount, pointsPrice: points }),
    });
    if (res.ok) {
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, rewardDiscount: discount, pointsPrice: points } : s));
      showToast(discount != null ? `${service.name} added to rewards` : `${service.name} removed from rewards`);
    }
    setSavingId(null);
  };

  const handleRewardUpdate = async (service: Service, field: "rewardDiscount" | "pointsPrice", value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    if (field === "rewardDiscount" && num > 100) return;
    const discount = field === "rewardDiscount" ? num : (service.rewardDiscount ?? 50);
    const points = field === "pointsPrice" ? num : (service.pointsPrice ?? Math.round(service.price * discount / 100));
    await handleToggleReward(service, discount, points);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted text-sm">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading...
      </div>
    );
  }

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
            <Gift size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            Select specific services below as <strong className="text-glam-text">redeemable rewards</strong> with a custom discount %
          </li>
          <li className="flex items-start gap-2">
            <Star size={13} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            Users redeem points from their account to get the discount on selected services
          </li>
        </ol>
      </div>

      {/* Service Rewards */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
        <div>
          <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
            <Gift size={16} className="text-primary" aria-hidden="true" />
            Service Rewards
          </h2>
          <p className="text-xs text-muted mt-1">Select services, set the discount %, and choose how many points users need to redeem.</p>
        </div>

        {/* Currently in rewards */}
        {rewardServices.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-primary uppercase tracking-wide">In Rewards Program</p>
            {rewardServices.map(s => {
              const discountedPrice = Math.round(s.price - s.price * (s.rewardDiscount ?? 0) / 100);
              return (
                <div key={s.id} className="bg-primary/5 border border-primary/15 rounded-2xl px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-glam-text truncate">{s.name}</p>
                      <p className="text-xs text-muted">{s.price} EGP → <strong className="text-green-600">{discountedPrice} EGP</strong></p>
                    </div>
                    <button
                      onClick={() => handleToggleReward(s, null, null)}
                      disabled={savingId === s.id}
                      className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1 shrink-0"
                    >
                      {savingId === s.id ? <Loader2 size={12} className="animate-spin" /> : "Remove"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1">Discount %</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={s.rewardDiscount ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, rewardDiscount: val ? parseInt(val, 10) : null } : sv));
                          }}
                          onBlur={(e) => handleRewardUpdate(s, "rewardDiscount", e.target.value)}
                          className="w-full bg-white border border-border rounded-lg px-2 py-2 text-sm text-center font-bold focus:outline-none focus:border-primary"
                        />
                        <Percent size={12} className="text-muted shrink-0" aria-hidden="true" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1">Points Needed</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          value={s.pointsPrice ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, pointsPrice: val ? parseInt(val, 10) : null } : sv));
                          }}
                          onBlur={(e) => handleRewardUpdate(s, "pointsPrice", e.target.value)}
                          className="w-full bg-white border border-border rounded-lg px-2 py-2 text-sm text-center font-bold focus:outline-none focus:border-primary"
                        />
                        <Star size={12} className="text-primary shrink-0" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  onClick={() => handleToggleReward(s, 50, Math.round(s.price * 50 / 100))}
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
