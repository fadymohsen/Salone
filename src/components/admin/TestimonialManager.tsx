"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Power, MessageSquareQuote } from "lucide-react";

type Item = { id: string; name: string; nameAr: string | null; quote: string; quoteAr: string | null; service: string | null; serviceAr: string | null; isActive: boolean };
type Form = { name: string; nameAr: string; quote: string; quoteAr: string; service: string; serviceAr: string };

const EMPTY: Form = { name: "", nameAr: "", quote: "", quoteAr: "", service: "", serviceAr: "" };
const INPUT = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function TestimonialManager() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);

  const fetch_ = async () => { setLoading(true); const r = await fetch("/api/admin/testimonials"); setItems(await r.json()); setLoading(false); };
  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setModal("create"); };
  const openEdit = (i: Item) => { setForm({ name: i.name, nameAr: i.nameAr ?? "", quote: i.quote, quoteAr: i.quoteAr ?? "", service: i.service ?? "", serviceAr: i.serviceAr ?? "" }); setEditId(i.id); setModal("edit"); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editId ? `/api/admin/testimonials/${editId}` : "/api/admin/testimonials";
    await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setModal(null); fetch_();
  };

  const toggleActive = async (i: Item) => {
    await fetch(`/api/admin/testimonials/${i.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...i, isActive: !i.isActive }) });
    fetch_();
  };

  const handleDelete = async (i: Item) => {
    await fetch(`/api/admin/testimonials/${i.id}`, { method: "DELETE" });
    setConfirmDelete(null); fetch_();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]">
          <Plus size={14} /> Add Feedback
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm"><Loader2 size={16} className="animate-spin" /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm bg-white rounded-2xl border border-border">
          <MessageSquareQuote size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} />
          No feedbacks yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <div key={i.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-bold text-sm text-glam-text">{i.name}</p>
                  {i.service && <p className="text-xs text-primary font-medium">{i.service}</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(i)}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer transition-all ${i.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-400 border-red-100"}`}>
                    <Power size={10} /> {i.isActive ? "Active" : "Off"}
                  </button>
                  <button onClick={() => openEdit(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all cursor-pointer"><Pencil size={13} /></button>
                  <button onClick={() => setConfirmDelete(i)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>
              <p className="text-sm text-muted italic leading-relaxed">&ldquo;{i.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="font-serif font-bold text-glam-text">{editId ? "Edit Feedback" : "New Feedback"}</h2>
              <button onClick={() => setModal(null)} className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Name (EN) *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT} /></div>
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Name (AR)</label><input dir="rtl" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className={INPUT} /></div>
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Quote (EN) *</label><textarea required rows={3} value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} className={INPUT} /></div>
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Quote (AR)</label><textarea dir="rtl" rows={3} value={form.quoteAr} onChange={e => setForm({ ...form, quoteAr: e.target.value })} className={INPUT} /></div>
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Service (EN)</label><input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className={INPUT} /></div>
              <div><label className="block text-xs font-bold text-glam-text/70 mb-1.5">Service (AR)</label><input dir="rtl" value={form.serviceAr} onChange={e => setForm({ ...form, serviceAr: e.target.value })} className={INPUT} /></div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer min-h-[48px]">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editId ? "Save Changes" : "Add Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0"><Trash2 size={20} className="text-red-500" /></div>
              <div>
                <p className="font-serif font-bold text-glam-text">Delete Feedback</p>
                <p className="text-sm text-muted mt-0.5">Delete <strong className="text-glam-text">{confirmDelete.name}</strong>&apos;s feedback?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer min-h-[48px]"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
