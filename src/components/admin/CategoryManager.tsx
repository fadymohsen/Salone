"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Power, FolderOpen } from "lucide-react";

type Category = {
  id: string;
  name: string;
  nameAr: string | null;
  sortOrder: number;
  isActive: boolean;
};

type FormState = { name: string; nameAr: string; isActive: boolean };

const EMPTY_FORM: FormState = { name: "", nameAr: "", isActive: true };

const INPUT =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal("create"); };
  const openEdit = (c: Category) => { setForm({ name: c.name, nameAr: c.nameAr ?? "", isActive: c.isActive }); setEditId(c.id); setModal("edit"); };
  const closeModal = () => setModal(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = modal === "edit" ? `/api/admin/categories/${editId}` : "/api/admin/categories";
    try {
      const res = await fetch(url, {
        method: modal === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { closeModal(); fetchCategories(); }
      else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Save failed."); }
    } catch { alert("Network error."); } finally { setSaving(false); }
  };

  const toggleActive = async (c: Category) => {
    await fetch(`/api/admin/categories/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, isActive: !c.isActive }),
    });
    fetchCategories();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Services in this category will become uncategorized.`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]">
          <Plus size={14} aria-hidden="true" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm bg-white rounded-2xl border border-border">
          <FolderOpen size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          No categories yet. Add your first one!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_80px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide items-center">
            <span className="text-center">Name (EN)</span>
            <span className="text-center">Name (AR)</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>
          {categories.map((c) => (
            <div key={c.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              {/* Desktop */}
              <div className="hidden md:grid grid-cols-[1fr_1fr_100px_80px] gap-3 px-5 py-3.5 items-center">
                <p className="font-bold text-sm text-glam-text text-center">{c.name}</p>
                <p className="text-sm text-muted text-center" dir="rtl">{c.nameAr ?? "—"}</p>
                <div className="flex justify-center">
                  <button onClick={() => toggleActive(c)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer ${
                      c.isActive
                        ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500"
                        : "bg-red-50 text-red-400 border-red-100 hover:bg-red-400 hover:text-white hover:border-red-400"
                    }`}>
                    <Power size={11} aria-hidden="true" /> {c.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="flex justify-center gap-1.5">
                  <button onClick={() => openEdit(c)} title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer">
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)} title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer">
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {/* Mobile */}
              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-glam-text">{c.name}</p>
                  {c.nameAr && <p className="text-xs text-muted" dir="rtl">{c.nameAr}</p>}
                </div>
                <button onClick={() => toggleActive(c)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150 ${
                    c.isActive
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-red-50 text-red-400 border-red-100"
                  }`}>
                  <Power size={10} aria-hidden="true" /> {c.isActive ? "On" : "Off"}
                </button>
                <button onClick={() => openEdit(c)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink cursor-pointer">
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer">
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="font-serif font-bold text-glam-text">
                {modal === "create" ? "New Category" : "Edit Category"}
              </h2>
              <button onClick={closeModal} aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Name (English) *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nails" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Name (Arabic) *</label>
                <input type="text" required dir="rtl" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="أظافر" className={INPUT} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all disabled:opacity-50 shadow-sm shadow-primary/20 cursor-pointer min-h-[48px]">
                  {saving ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving...</> : modal === "create" ? "Add Category" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
