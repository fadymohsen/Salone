"use client";

import { useState, useEffect } from "react";
import { Tag, RotateCcw, Power, Trash2, Plus, Loader2 } from "lucide-react";

type Promo = {
  id: string;
  code: string;
  discount: number;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null;
  createdAt: string;
};

function randomCode() {
  const prefixes = ["GLOW", "ROSE", "NAILS", "SHINE", "VIP", "QUEEN"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(Math.random() * 46) + 5;
  return `${prefix}${num}`;
}

const INPUT_CLS = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function PromoManager() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: randomCode(), discount: "15", maxUsage: "" });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    setPromos(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.code, discount: Number(form.discount), maxUsage: form.maxUsage ? Number(form.maxUsage) : null }),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ code: randomCode(), discount: "15", maxUsage: "" });
      setShowForm(false);
      fetchPromos();
    } else {
      const err = await res.json();
      alert(err.error ?? "Failed to create code.");
    }
  };

  const toggleActive = async (p: Promo) => {
    await fetch(`/api/admin/promos/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    fetchPromos();
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete promo code ${code}?`)) return;
    await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
    fetchPromos();
  };

  return (
    <div className="space-y-4">
      {/* Header button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setForm({ code: randomCode(), discount: "15", maxUsage: "" }); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]"
        >
          {showForm ? (
            <><Tag size={14} aria-hidden="true" /> Cancel</>
          ) : (
            <><Plus size={14} aria-hidden="true" /> Generate Code</>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
            <Tag size={16} className="text-primary" aria-hidden="true" />
            New Promo Code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Code</label>
              <div className="flex gap-1.5">
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className={`${INPUT_CLS} flex-1 font-bold uppercase tracking-wider`}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, code: randomCode() })}
                  title="Regenerate code"
                  className="w-10 flex items-center justify-center bg-pastel-pink text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Discount %</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Max Uses <span className="font-normal text-muted">(optional)</span></label>
              <input
                type="number"
                min="1"
                value={form.maxUsage}
                onChange={(e) => setForm({ ...form, maxUsage: e.target.value })}
                placeholder="Unlimited"
                className={INPUT_CLS}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-all duration-150 disabled:opacity-50 min-h-[48px] cursor-pointer shadow-sm shadow-primary/20"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Creating…</>
            ) : "Create Promo Code"}
          </button>
        </form>
      )}

      {/* Promos list */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm bg-white rounded-2xl border border-border">
          <Tag size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          No promo codes yet. Generate your first one!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_90px_90px_110px_100px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide">
            <span>Code</span><span>Discount</span><span>Uses</span><span>Status</span><span>Actions</span>
          </div>
          {promos.map((p) => (
            <div key={p.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[1fr_90px_90px_110px_100px] gap-3 px-5 py-3.5 items-center">
                <span className="font-black text-glam-text tracking-wider flex items-center gap-2">
                  <Tag size={13} className="text-primary/50" aria-hidden="true" />
                  {p.code}
                </span>
                <span className="font-bold text-primary tabular-nums">{p.discount}% off</span>
                <span className="text-sm text-muted tabular-nums">
                  {p.usageCount}{p.maxUsage ? `/${p.maxUsage}` : ""}
                </span>
                <button
                  onClick={() => toggleActive(p)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 w-fit cursor-pointer ${
                    p.isActive
                      ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500"
                      : "bg-red-50 text-red-400 border-red-100 hover:bg-red-400 hover:text-white hover:border-red-400"
                  }`}
                >
                  <Power size={11} aria-hidden="true" />
                  {p.isActive ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.code)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Delete
                </button>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-black text-glam-text tracking-wider">{p.code}</p>
                  <p className="text-xs text-muted mt-0.5">{p.discount}% off · Used {p.usageCount}{p.maxUsage ? `/${p.maxUsage}` : ""} times</p>
                </div>
                <button
                  onClick={() => toggleActive(p)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150 ${
                    p.isActive
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-red-50 text-red-400 border-red-100"
                  }`}
                >
                  <Power size={10} aria-hidden="true" />
                  {p.isActive ? "Active" : "Paused"}
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.code)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
