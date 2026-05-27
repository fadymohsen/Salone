"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Power, X, Loader2, ImageIcon, Upload, Link } from "lucide-react";

type GalleryImage = {
  id: string; title: string; imageUrl: string; serviceId: string | null;
  sortOrder: number; isActive: boolean; createdAt: string;
};
type ServiceOption = { id: string; name: string };

const INPUT = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [form, setForm] = useState({ title: "", imageUrl: "", serviceId: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const [imgRes, svcRes] = await Promise.all([
        fetch("/api/admin/gallery"),
        fetch("/api/admin/services"),
      ]);
      const [imgData, svcData] = await Promise.all([imgRes.json(), svcRes.json()]);
      setImages(Array.isArray(imgData) ? imgData : []);
      setServices(Array.isArray(svcData) ? svcData : []);
    } catch {
      setImages([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const { url } = await res.json();
      setForm((f) => ({ ...f, imageUrl: url }));
    } else {
      alert("Upload failed. Please try again.");
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) { alert("Please upload an image or paste a URL first."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ title: "", imageUrl: "", serviceId: "" });
      setShowForm(false);
      fetchImages();
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to add image.");
    }
  };

  const toggleActive = async (img: GalleryImage) => {
    await fetch(`/api/admin/gallery/${img.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...img, isActive: !img.isActive }),
    });
    fetchImages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gallery image?")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" });
    fetchImages();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(!showForm); setForm({ title: "", imageUrl: "", serviceId: "" }); }}
          className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]"
        >
          {showForm ? <><X size={14} aria-hidden="true" /> Cancel</> : <><Plus size={14} aria-hidden="true" /> Add Image</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-glam-text flex items-center gap-2">
            <ImageIcon size={16} className="text-primary" aria-hidden="true" />
            New Gallery Image
          </h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Title *</label>
            <input type="text" required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Glazed Donut Nails" className={INPUT} />
          </div>

          {/* Upload / URL tabs */}
          <div>
            <div className="flex gap-1 mb-3 bg-pastel-pink rounded-xl p-1">
              {(["upload", "url"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-all duration-150 cursor-pointer ${tab === t ? "bg-white text-primary shadow-sm" : "text-glam-text/50 hover:text-glam-text"}`}>
                  {t === "upload" ? <><Upload size={12} aria-hidden="true" /> Upload File</> : <><Link size={12} aria-hidden="true" /> Paste URL</>}
                </button>
              ))}
            </div>

            {tab === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${dragOver ? "border-primary bg-pastel-pink/50" : "border-border hover:border-primary/50 hover:bg-pastel-pink/20"}`}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFilePick} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-primary" aria-hidden="true" />
                    <p className="text-sm text-muted">Uploading…</p>
                  </div>
                ) : form.imageUrl && tab === "upload" ? (
                  <div className="space-y-2">
                    <div className="w-full h-36 rounded-lg overflow-hidden">
                      <img src={form.imageUrl} alt="Uploaded preview" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-green-600 font-bold">Uploaded! Click to replace.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Upload size={24} className="text-muted/40" aria-hidden="true" />
                    <p className="text-sm font-bold text-glam-text">Drop an image here</p>
                    <p className="text-xs text-muted">or click to browse — JPG, PNG, WebP</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input type="url" value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://…" className={`${INPUT} pl-9`} />
                </div>
                {form.imageUrl && (
                  <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-border bg-pastel-pink/30">
                    <img src={form.imageUrl} alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = "none")} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service link */}
          <div>
            <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
              Linked Service <span className="font-normal text-muted">(optional)</span>
            </label>
            <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className={INPUT}>
              <option value="">— No service link —</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving || uploading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-all disabled:opacity-50 min-h-[48px] cursor-pointer shadow-sm shadow-primary/20">
            {saving ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving…</> : "Add to Gallery"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <ImageIcon size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm text-muted">No gallery images yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => {
            const linkedService = services.find((s) => s.id === img.serviceId);
            return (
              <div key={img.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all duration-150 ${img.isActive ? "border-border" : "border-dashed border-muted/30 opacity-60"}`}>
                <div className="aspect-square bg-pastel-pink/30 relative overflow-hidden">
                  <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  {!img.isActive && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-bold text-muted bg-white px-2 py-1 rounded-full border border-border">Hidden</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-bold text-xs text-glam-text truncate">{img.title}</p>
                  {linkedService && (
                    <p className="text-xs text-muted truncate mt-0.5">{linkedService.name}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <button onClick={() => toggleActive(img)} title={img.isActive ? "Hide" : "Show"}
                      className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer transition-all duration-150 flex-1 justify-center ${img.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                      <Power size={10} aria-hidden="true" />
                      {img.isActive ? "Live" : "Off"}
                    </button>
                    <button onClick={() => handleDelete(img.id)} title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer">
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
