"use client";

import { useState, useEffect } from "react";
import { Tag, RotateCcw, Power, Trash2, Plus, Loader2, AlertTriangle, X, CheckSquare, Pencil } from "lucide-react";

type ServiceOption = { id: string; name: string };

type Promo = {
  id: string;
  code: string;
  discount: number;
  isActive: boolean;
  usageCount: number;
  maxUsage: number | null;
  serviceIds: string | null;
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
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: randomCode(), discount: "15", maxUsage: "", selectedServices: [] as string[], allServices: true });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Promo | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [viewServicesPromo, setViewServicesPromo] = useState<Promo | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchPromos = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    setPromos(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/promos").then(r => r.json()),
      fetch("/api/admin/services").then(r => r.json()),
    ]).then(([pData, sData]) => {
      setPromos(Array.isArray(pData) ? pData : []);
      setServices(Array.isArray(sData) ? sData : []);
      setLoading(false);
    });
  }, []);

  const openEdit = (p: Promo) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      discount: String(p.discount),
      maxUsage: p.maxUsage ? String(p.maxUsage) : "",
      selectedServices: p.serviceIds ? p.serviceIds.split(",") : [],
      allServices: !p.serviceIds,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code,
      discount: Number(form.discount),
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
      serviceIds: form.allServices ? null : form.selectedServices.join(","),
    };
    const url = editId ? `/api/admin/promos/${editId}` : "/api/admin/promos";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) {
      setForm({ code: randomCode(), discount: "15", maxUsage: "", selectedServices: [], allServices: true });
      setShowForm(false);
      setEditId(null);
      fetchPromos();
    } else {
      const err = await res.json();
      setToast(err.error ?? "Failed to save.");
      setTimeout(() => setToast(null), 3000);
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

  const handleDelete = async (promo: Promo) => {
    await fetch(`/api/admin/promos/${promo.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchPromos();
  };

  return (
    <div className="space-y-4">
      {/* Header button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setForm({ code: randomCode(), discount: "15", maxUsage: "", selectedServices: [], allServices: true }); setEditId(null); setShowForm(!showForm); }}
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
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
            <Tag size={16} className="text-primary" aria-hidden="true" />
            {editId ? "Edit Promo Code" : "New Promo Code"}
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

          {/* Service Selection — compact */}
          <div>
            <label className="block text-xs font-bold text-glam-text/70 mb-2">Applies to</label>
            <div className="flex items-center gap-2">
              {form.allServices ? (
                <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-bold px-3 py-2 rounded-xl border border-primary/20">
                  <CheckSquare size={13} aria-hidden="true" /> All Services
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-pastel-pink text-primary text-sm font-bold px-3 py-2 rounded-xl">
                  {form.selectedServices.length} service{form.selectedServices.length !== 1 ? "s" : ""} selected
                </span>
              )}
              <button type="button" onClick={() => setShowServicePicker(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors cursor-pointer px-3 py-2 rounded-xl border border-border hover:border-primary/40">
                <Pencil size={12} aria-hidden="true" /> Edit
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || (!form.allServices && form.selectedServices.length === 0)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-all duration-150 disabled:opacity-50 min-h-[48px] cursor-pointer shadow-sm shadow-primary/20"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> {editId ? "Saving…" : "Creating…"}</>
            ) : editId ? "Save Changes" : "Create Promo Code"}
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
          <div className="hidden md:grid grid-cols-[1fr_90px_90px_110px_80px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide items-center">
            <span>Code</span><span className="text-center">Discount</span><span className="text-center">Uses</span><span className="text-center">Status</span><span className="text-center">Actions</span>
          </div>
          {promos.map((p) => (
            <div key={p.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[1fr_90px_90px_110px_80px] gap-3 px-5 py-3.5 items-center">
                <div className="flex items-center gap-2">
                  <span className="font-black text-glam-text tracking-wider flex items-center gap-2">
                    <Tag size={13} className="text-primary/50" aria-hidden="true" />
                    {p.code}
                  </span>
                  {p.serviceIds ? (
                    <button type="button" onClick={() => setViewServicesPromo(p)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-pastel-pink px-2 py-0.5 rounded-full hover:bg-primary hover:text-white transition-all cursor-pointer">
                      {p.serviceIds.split(",").length} service{p.serviceIds.split(",").length !== 1 ? "s" : ""}
                      <Pencil size={9} aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">All Services</span>
                  )}
                </div>
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
                <div className="flex justify-center gap-1.5">
                  <button onClick={() => openEdit(p)} title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer">
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button onClick={() => setConfirmDelete(p)} title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer">
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-black text-glam-text tracking-wider">{p.code}</p>
                  <p className="text-xs text-muted">{p.serviceIds ? `${p.serviceIds.split(",").length} services` : "All services"}</p>
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
                <button onClick={() => openEdit(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink cursor-pointer">
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  onClick={() => setConfirmDelete(p)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Picker Modal (for create form) */}
      {showServicePicker && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowServicePicker(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-glam-text">Select Services</h2>
              <button onClick={() => setShowServicePicker(false)} aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-2">
              <button type="button"
                onClick={() => setForm({ ...form, allServices: true, selectedServices: [] })}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  form.allServices
                    ? "bg-primary text-white border-primary"
                    : "bg-background text-glam-text border-border hover:border-primary/50"
                }`}>
                <CheckSquare size={14} aria-hidden="true" /> All Services
              </button>
              {!form.allServices && <p className="text-xs text-muted py-1">Or select specific services:</p>}
              {services.map((s) => {
                const checked = form.allServices || form.selectedServices.includes(s.id);
                return (
                  <button key={s.id} type="button"
                    disabled={form.allServices}
                    onClick={() => setForm({
                      ...form,
                      allServices: false,
                      selectedServices: form.selectedServices.includes(s.id)
                        ? form.selectedServices.filter(id => id !== s.id)
                        : [...form.selectedServices, s.id],
                    })}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-start text-sm font-medium transition-all duration-150 cursor-pointer ${
                      form.allServices ? "opacity-40 cursor-not-allowed border-border" :
                      checked ? "bg-primary/5 border-primary text-primary" : "bg-background border-border text-glam-text hover:border-primary/40"
                    }`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      checked ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {checked && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0">
              <button type="button" onClick={() => setShowServicePicker(false)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-all duration-150 cursor-pointer min-h-[48px]">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Services Popup (for promo list) */}
      {viewServicesPromo && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setViewServicesPromo(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-glam-text">{viewServicesPromo.code}</h2>
                <p className="text-xs text-muted">{viewServicesPromo.discount}% off · Applied to:</p>
              </div>
              <button onClick={() => setViewServicesPromo(null)} aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {viewServicesPromo.serviceIds ? (
                viewServicesPromo.serviceIds.split(",").map((id) => {
                  const svc = services.find(s => s.id === id);
                  return svc ? (
                    <div key={id} className="flex items-center gap-2 bg-pastel-pink/40 rounded-xl px-4 py-2.5">
                      <Tag size={12} className="text-primary shrink-0" aria-hidden="true" />
                      <span className="text-sm font-medium text-glam-text">{svc.name}</span>
                    </div>
                  ) : null;
                })
              ) : (
                <div className="text-center py-4">
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full border border-green-100">All Services</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Branded Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-3 bg-glam-text text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/20 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} aria-hidden="true" />
            </div>
            <p className="text-sm font-medium flex-1">{toast}</p>
            <button onClick={() => setToast(null)} className="text-white/50 hover:text-white cursor-pointer">
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Branded Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-500" aria-hidden="true" />
              </div>
              <div>
                <p className="font-serif font-bold text-glam-text">Delete Promo Code</p>
                <p className="text-sm text-muted mt-0.5">Are you sure you want to delete <strong className="text-glam-text">{confirmDelete.code}</strong>?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer min-h-[48px]">
                <Trash2 size={14} aria-hidden="true" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
