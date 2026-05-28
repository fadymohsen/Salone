"use client";

import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Star, Power, Tag, Home, Clock,
  Sparkles, Gem, Palette, Eye, Scissors, Heart, Wand2, Brush,
  Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type CategoryOption = { id: string; name: string; nameAr: string | null };

type Service = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  price: number;
  isActive: boolean;
  popular: boolean;
  featured: boolean;
  pointsPrice: number | null;
  duration: number;
  iconName: string | null;
  sortOrder: number;
  availableDays: string;
  timeSlots: string;
  categoryId: string | null;
};

type FormState = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  isActive: boolean;
  popular: boolean;
  featured: boolean;
  pointsPrice: string;
  duration: number;
  iconName: string;
  categoryId: string;
  dayRanges: Record<string, { start: string; end: string }>;
};

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TIMES = ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];

const EMPTY_FORM: FormState = {
  name: "",
  nameAr: "",
  description: "",
  descriptionAr: "",
  price: 0,
  isActive: true,
  popular: false,
  featured: false,
  pointsPrice: "",
  duration: 0,
  iconName: "",
  categoryId: "",
  dayRanges: {},
};

function generateSlots(start: string, end: string, durationMin: number): string[] {
  if (!start || !end || durationMin <= 0) return [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const slots: string[] = [];
  for (let m = startMins; m + durationMin <= endMins; m += durationMin) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

const INPUT =
  "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type IconEntry = { name: string; Icon: LucideIcon };

const ICON_OPTIONS: IconEntry[] = [
  { name: "Sparkles", Icon: Sparkles },
  { name: "Gem",      Icon: Gem },
  { name: "Star",     Icon: Star },
  { name: "Palette",  Icon: Palette },
  { name: "Eye",      Icon: Eye },
  { name: "Scissors", Icon: Scissors },
  { name: "Heart",    Icon: Heart },
  { name: "Wand2",    Icon: Wand2 },
  { name: "Brush",    Icon: Brush },
  { name: "Crown",    Icon: Crown },
  { name: "Leaf",     Icon: Leaf },
  { name: "Sun",      Icon: Sun },
  { name: "Zap",      Icon: Zap },
  { name: "Droplets", Icon: Droplets },
  { name: "Flower2",  Icon: Flower2 },
  { name: "Ribbon",   Icon: Ribbon },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDays(csv: string): number[] {
  return csv
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
}

function parseTimes(csv: string): string[] {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => {
    const [ah, am] = a.split(":").map(Number);
    const [bh, bm] = b.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });
}

function parseDayRanges(availableDays: string, timeSlots: string): Record<string, { start: string; end: string }> {
  // Try JSON range format: {"ranges":{"0":{"start":"10:00","end":"16:00"},...}}
  try {
    const parsed = JSON.parse(timeSlots);
    if (parsed.ranges && typeof parsed.ranges === "object") return parsed.ranges;
    // Legacy per-day slots format: {"0":["10:00","11:00",...]} — infer range
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: Record<string, { start: string; end: string }> = {};
      for (const [day, slots] of Object.entries(parsed)) {
        const arr = slots as string[];
        if (arr.length > 0) {
          result[day] = { start: arr[0], end: arr[arr.length - 1] };
        }
      }
      return result;
    }
  } catch { /* not JSON */ }
  // Legacy CSV format
  const days = parseDays(availableDays);
  const times = parseTimes(timeSlots);
  const result: Record<string, { start: string; end: string }> = {};
  if (times.length > 0) {
    for (const d of days) result[String(d)] = { start: times[0], end: times[times.length - 1] };
  }
  return result;
}

function formFromService(s: Service): FormState {
  return {
    name: s.name,
    nameAr: s.nameAr ?? "",
    description: s.description ?? "",
    descriptionAr: s.descriptionAr ?? "",
    price: s.price,
    isActive: s.isActive,
    popular: s.popular,
    featured: s.featured,
    pointsPrice: s.pointsPrice != null ? String(s.pointsPrice) : "",
    duration: s.duration,
    iconName: s.iconName ?? "",
    categoryId: s.categoryId ?? "",
    dayRanges: (s.availableDays && s.timeSlots) ? parseDayRanges(s.availableDays, s.timeSlots) : {},
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; icon: "home" | "star" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => { fetchServices(); fetchCategories(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);

    setModal("create");
  };

  const openEdit = (s: Service) => {
    setForm(formFromService(s));
    setEditId(s.id);

    setModal("edit");
  };

  const closeModal = () => setModal(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("Name (English)");
    if (!form.nameAr.trim()) missing.push("Name (Arabic)");
    if (!form.description.trim()) missing.push("Description (English)");
    if (!form.descriptionAr.trim()) missing.push("Description (Arabic)");
    if (!form.price && form.price !== 0) missing.push("Price");
    if (!form.duration) missing.push("Duration");
    if (!form.categoryId) missing.push("Category");
    if (Object.keys(form.dayRanges).length === 0) missing.push("Available Days & Time Ranges");
    if (missing.length > 0) { setErrors(missing); return; }
    setErrors([]);
    setSaving(true);
    const url =
      modal === "edit" ? `/api/admin/services/${editId}` : "/api/admin/services";
    const body = {
      name: form.name,
      nameAr: form.nameAr,
      description: form.description,
      descriptionAr: form.descriptionAr,
      price: Number(form.price),
      isActive: form.isActive,
      popular: form.popular,
      featured: form.featured,
      pointsPrice: form.pointsPrice ? Number(form.pointsPrice) : null,
      duration: form.duration,
      iconName: form.iconName,
      categoryId: form.categoryId || null,
      availableDays: Object.keys(form.dayRanges).sort((a, b) => Number(a) - Number(b)).join(","),
      timeSlots: JSON.stringify({ ranges: form.dayRanges }),
    };
    try {
      const res = await fetch(url, {
        method: modal === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        closeModal();
        fetchServices();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Save failed.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Service) => {
    const becoming = !s.isActive;
    const updates: Record<string, unknown> = { ...s, isActive: becoming };
    // When deactivating: remove from homepage and remove popular
    if (!becoming) {
      updates.featured = false;
      updates.popular = false;
    }
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchServices();
  };

  const handleDelete = async (service: Service) => {
    await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchServices();
  };

  const showToast = (msg: string, icon: "home" | "star" = "home") => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFeatured = async (s: Service) => {
    const featuredCount = services.filter((sv) => sv.featured).length;
    if (s.featured) {
      // Trying to un-feature
      if (featuredCount <= 3) {
        showToast("You must keep at least 3 featured services on the homepage.");
        return;
      }
    } else {
      // Trying to feature
      if (featuredCount >= 6) {
        showToast("Maximum 6 featured services allowed on the homepage.");
        return;
      }
    }
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, featured: !s.featured }),
    });
    fetchServices();
  };

  const togglePopular = async (s: Service) => {
    const popularCount = services.filter((sv) => sv.popular).length;
    if (s.popular) {
      // un-popular is always allowed
    } else {
      if (popularCount >= 3) {
        showToast("Maximum 3 services can be marked as Most Popular.", "star");
        return;
      }
    }
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, popular: !s.popular }),
    });
    fetchServices();
  };

  // Day toggle
  const toggleDay = (day: number) => {
    setForm((prev) => {
      const key = String(day);
      const next = { ...prev.dayRanges };
      if (next[key]) { delete next[key]; } else { next[key] = { start: "10:00", end: "14:00" }; }
      return { ...prev, dayRanges: next };
    });
  };

  const updateDayRange = (day: string, field: "start" | "end", value: string) => {
    setForm((prev) => ({
      ...prev,
      dayRanges: { ...prev.dayRanges, [day]: { ...prev.dayRanges[day], [field]: value } },
    }));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]"
        >
          <Plus size={14} aria-hidden="true" /> Add Service
        </button>
      </div>

      {/* Service list */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm bg-white rounded-2xl border border-border">
          <Tag size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          No services yet. Add your first one!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_80px_120px_100px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide items-center">
            <span className="w-9" />
            <span className="text-center">Service</span>
            <span className="text-center">Price</span>
            <span className="text-center">Popular</span>
            <span className="text-center">Home</span>
            <span className="text-center">Status</span>
            <span className="text-center">Actions</span>
          </div>
          {services.map((s) => {
            const iconEntry = ICON_OPTIONS.find((o) => o.name === s.iconName);
            const IconComp = iconEntry ? iconEntry.Icon : Sparkles;
            return (
            <div
              key={s.id}
              className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100"
            >
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_80px_120px_100px] gap-3 px-5 py-3.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center shrink-0">
                  <IconComp size={16} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-sm text-glam-text text-center">{s.name}</p>
                </div>
                <span className="font-bold text-primary text-sm tabular-nums text-center">{s.price} EGP</span>
                <div className="flex justify-center">
                  <button
                    onClick={() => togglePopular(s)}
                    title={s.popular ? "Remove Most Popular" : "Mark as Most Popular"}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                      s.popular
                        ? "bg-yellow-400 text-white"
                        : "bg-background text-muted border border-border hover:border-yellow-400 hover:text-yellow-500"
                    }`}
                  >
                    <Star size={13} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleFeatured(s)}
                    title={s.featured ? "Remove from homepage" : "Show on homepage"}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                      s.featured
                        ? "bg-primary text-white"
                        : "bg-background text-muted border border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    <Home size={13} aria-hidden="true" />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleActive(s)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 cursor-pointer ${
                      s.isActive
                        ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500"
                        : "bg-red-50 text-red-400 border-red-100 hover:bg-red-400 hover:text-white hover:border-red-400"
                    }`}
                  >
                    <Power size={11} aria-hidden="true" />
                    {s.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                <div className="flex justify-center gap-1.5">
                  <button
                    onClick={() => openEdit(s)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s)}
                    title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {/* Mobile row */}
              <div className="md:hidden px-4 py-3 space-y-2.5">
                {/* Line 1: Name + Price */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pastel-pink flex items-center justify-center shrink-0">
                      <IconComp size={14} className="text-primary" aria-hidden="true" />
                    </div>
                    <p className="font-bold text-sm text-glam-text truncate">{s.name}</p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">{s.price} EGP</span>
                </div>
                {/* Line 2: Actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => togglePopular(s)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                      s.popular ? "bg-yellow-400 text-white" : "bg-background text-muted border border-border"
                    }`}>
                    <Star size={12} aria-hidden="true" />
                  </button>
                  <button onClick={() => toggleFeatured(s)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 cursor-pointer ${
                      s.featured ? "bg-primary text-white" : "bg-background text-muted border border-border"
                    }`}>
                    <Home size={12} aria-hidden="true" />
                  </button>
                  <button onClick={() => toggleActive(s)}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150 ${
                      s.isActive ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-400 border-red-100"
                    }`}>
                    <Power size={10} aria-hidden="true" /> {s.isActive ? "On" : "Off"}
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => openEdit(s)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink cursor-pointer">
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button onClick={() => setConfirmDelete(s)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer">
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Full-screen Service Form */}
      {modal && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer"
              >
                <X size={16} aria-hidden="true" />
              </button>
              <h2 className="font-serif text-lg font-bold text-glam-text">
                {modal === "create" ? "New Service" : "Edit Service"}
              </h2>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <form
              onSubmit={handleSave}
              noValidate
              className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5"
            >
              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <X size={14} className="text-red-500" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">Please fill in the following fields:</p>
                    <ul className="mt-1 space-y-0.5">
                      {errors.map((err) => (
                        <li key={err} className="text-xs text-red-500">• {err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Category (first field) */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const selected = form.categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm({ ...form, categoryId: c.id })}
                        className={`px-3 py-3 rounded-xl border text-sm font-semibold text-center transition-all duration-150 cursor-pointer min-h-[48px] ${
                          selected
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                            : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {c.name}
                        {c.nameAr && <span className="block text-xs mt-0.5 opacity-70" dir="rtl">{c.nameAr}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name (English) */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Name (English) *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Classic Manicure"
                  className={`${INPUT} ${errors.includes("Name (English)") ? "border-red-400 ring-2 ring-red-100" : ""}`}
                />
              </div>

              {/* Name (Arabic) */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Name (Arabic) *
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.nameAr}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  placeholder="مانيكير كلاسيكي"
                  className={`${INPUT} ${errors.includes("Name (Arabic)") ? "border-red-400 ring-2 ring-red-100" : ""}`}
                />
              </div>

              {/* Description (English) */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Description (English) *
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description…"
                  className={`${INPUT} ${errors.includes("Description (English)") ? "border-red-400 ring-2 ring-red-100" : ""}`}
                />
              </div>

              {/* Description (Arabic) */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Description (Arabic) *
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={form.descriptionAr}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                  placeholder="وصف قصير…"
                  className={`${INPUT} ${errors.includes("Description (Arabic)") ? "border-red-400 ring-2 ring-red-100" : ""}`}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="150"
                  className={`${INPUT} ${errors.includes("Price") ? "border-red-400 ring-2 ring-red-100" : ""}`}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">Duration *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 15, label: "15 min" },
                    { value: 30, label: "30 min" },
                    { value: 45, label: "45 min" },
                    { value: 60, label: "1H" },
                    { value: 75, label: "1H 15m" },
                    { value: 90, label: "1H 30m" },
                    { value: 105, label: "1H 45m" },
                    { value: 120, label: "2H" },
                  ].map((opt) => {
                    const selected = form.duration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, duration: opt.value })}
                        className={`py-2.5 rounded-xl border text-xs font-bold text-center transition-all duration-150 cursor-pointer min-h-[44px] ${
                          selected
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                            : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-glam-text">Active</span>
                </label>
              </div>

              {/* ── Schedule: Days & Time Ranges ──────────────────── */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">
                  Business Hours *
                </label>
                <p className="text-xs text-muted mb-3">Select days and set working hours. Slots are auto-generated from the duration.</p>
                <div className="flex gap-1.5 flex-wrap mb-4">
                  {DAY_LABELS.map((label, dayIndex) => {
                    const active = !!form.dayRanges[String(dayIndex)];
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        onClick={() => toggleDay(dayIndex)}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer border ${
                          active
                            ? "bg-primary text-white border-primary"
                            : "bg-background text-muted border-border hover:bg-pastel-pink"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Per-day time ranges */}
                <div className="space-y-3">
                  {DAY_LABELS.map((label, dayIndex) => {
                    const key = String(dayIndex);
                    const range = form.dayRanges[key];
                    if (!range) return null;
                    const slots = generateSlots(range.start, range.end, form.duration || 60);
                    const fmt = (t: string) => {
                      const [h, m] = t.split(":").map(Number);
                      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                    };
                    const parse12 = (val: string): { h: number; m: number; p: string } => {
                      const [hh, mm] = val.split(":").map(Number);
                      return { h: hh % 12 || 12, m: mm, p: hh >= 12 ? "PM" : "AM" };
                    };
                    const to24 = (h: number, m: number, p: string): string => {
                      const h24 = p === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
                      return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                    };
                    const startP = parse12(range.start);
                    const endP = parse12(range.end);
                    const invalid = range.end <= range.start;

                    const updateFrom = (h?: number, m?: number, p?: string) => {
                      const nh = h ?? startP.h, nm = m ?? startP.m, np = p ?? startP.p;
                      const val = to24(nh, nm, np);
                      updateDayRange(key, "start", val);
                      if (range.end <= val) updateDayRange(key, "end", "");
                    };
                    const updateTo = (h?: number, m?: number, p?: string) => {
                      const nh = h ?? endP.h, nm = m ?? endP.m, np = p ?? endP.p;
                      const val = to24(nh, nm, np);
                      if (val > range.start) updateDayRange(key, "end", val);
                    };

                    const TimePicker = ({ label2, parsed, onUpdate, minTime }: { label2: string; parsed: { h: number; m: number; p: string }; onUpdate: (h?: number, m?: number, p?: string) => void; minTime?: string }) => {
                      const isDisabled = (h: number, m: number, p: string) => {
                        if (!minTime) return false;
                        const h24 = p === "AM" ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
                        return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}` <= minTime;
                      };
                      return (
                      <div>
                        <label className="block text-xs font-bold text-muted mb-2">{label2}</label>
                        <div className="bg-white border border-border rounded-2xl p-3 space-y-2.5">
                          {/* Hour */}
                          <div>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wide mb-1.5">Hour</p>
                            <div className="grid grid-cols-6 gap-1">
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => {
                                const dis = minTime ? isDisabled(h, parsed.m, parsed.p) && isDisabled(h, parsed.m, parsed.p === "AM" ? "PM" : parsed.p) : false;
                                return (
                                <button key={h} type="button" onClick={() => !dis && onUpdate(h)} disabled={dis}
                                  className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-100 ${
                                    parsed.h === h ? "bg-primary text-white shadow-sm cursor-pointer" : dis ? "text-muted/25 cursor-not-allowed" : "text-glam-text hover:bg-pastel-pink hover:text-primary cursor-pointer"
                                  }`}>{h}</button>
                                );
                              })}
                            </div>
                          </div>
                          {/* Minute */}
                          <div>
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wide mb-1.5">Min</p>
                            <div className="grid grid-cols-4 gap-1">
                              {[0, 15, 30, 45].map(m => {
                                const dis = minTime ? isDisabled(parsed.h, m, parsed.p) : false;
                                return (
                                <button key={m} type="button" onClick={() => !dis && onUpdate(undefined, m)} disabled={dis}
                                  className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-100 ${
                                    parsed.m === m ? "bg-primary text-white shadow-sm cursor-pointer" : dis ? "text-muted/25 cursor-not-allowed" : "text-glam-text hover:bg-pastel-pink hover:text-primary cursor-pointer"
                                  }`}>{String(m).padStart(2, "0")}</button>
                                );
                              })}
                            </div>
                          </div>
                          {/* AM/PM */}
                          <div className="grid grid-cols-2 gap-1">
                            {(["AM", "PM"] as const).map(p => {
                              const dis = minTime ? p === "AM" && parsed.p === "AM" && isDisabled(parsed.h, parsed.m, "AM") && range.start >= "12:00" : false;
                              return (
                              <button key={p} type="button" onClick={() => onUpdate(undefined, undefined, p)}
                                className={`py-2 rounded-lg text-xs font-black tracking-wide transition-all duration-100 cursor-pointer ${
                                  parsed.p === p ? "bg-primary text-white shadow-sm" : "text-glam-text hover:bg-pastel-pink hover:text-primary"
                                }`}>{p}</button>
                              );
                            })}
                          </div>
                          {/* Display */}
                          <div className="text-center pt-1 border-t border-border">
                            <span className="text-sm font-black text-primary">{parsed.h}:{String(parsed.m).padStart(2, "0")} {parsed.p}</span>
                          </div>
                        </div>
                      </div>
                      );
                    };

                    return (
                      <div key={dayIndex} className="bg-background border border-border rounded-2xl p-4">
                        <p className="text-xs font-bold text-glam-text mb-3 flex items-center gap-2">
                          <Clock size={12} className="text-primary" aria-hidden="true" />
                          {label}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <TimePicker label2="From" parsed={startP} onUpdate={(h, m, p) => updateFrom(h, m, p)} />
                          <TimePicker label2="To" parsed={endP} onUpdate={(h, m, p) => updateTo(h, m, p)} minTime={range.start} />
                        </div>
                        {invalid && range.end && (
                          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
                            <X size={12} className="text-red-500 shrink-0" aria-hidden="true" />
                            <p className="text-xs font-medium text-red-500">&quot;To&quot; time must be after &quot;From&quot; time</p>
                          </div>
                        )}
                        {!invalid && slots.length > 0 ? (
                          <div>
                            <p className="text-xs text-muted mb-1.5">{slots.length} slots generated:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {slots.map((t) => (
                                <span key={t} className="bg-pastel-pink text-primary text-xs font-semibold px-2.5 py-1 rounded-full">{fmt(t)}</span>
                              ))}
                            </div>
                          </div>
                        ) : !invalid ? (
                          <p className="text-xs text-red-400">No slots fit in this range{form.duration ? ` with ${form.duration} min duration` : ". Select a duration first"}.</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Icon picker (at the bottom) ──────────────────────── */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map(({ name, Icon }) => {
                    const selected = form.iconName === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, iconName: selected ? "" : name })}
                        title={name}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl min-h-[44px] min-w-[44px] p-1.5 text-[10px] font-semibold leading-tight transition-all duration-150 cursor-pointer border ${
                          selected
                            ? "bg-primary text-white border-primary"
                            : "bg-pastel-pink text-primary border-transparent hover:bg-primary/20"
                        }`}
                      >
                        <Icon size={16} aria-hidden="true" />
                        <span className="truncate w-full text-center">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 pb-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3.5 rounded-2xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[52px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all disabled:opacity-50 shadow-md shadow-primary/25 cursor-pointer min-h-[52px]"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : modal === "create" ? (
                    "Add Service"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
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
                <p className="font-serif font-bold text-glam-text">Delete Service</p>
                <p className="text-sm text-muted mt-0.5">Are you sure you want to delete <strong className="text-glam-text">{confirmDelete.name}</strong>? This cannot be undone.</p>
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

      {/* Branded Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-[fadeInUp_0.2s_ease-out]">
          <div className="flex items-center gap-3 bg-glam-text text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-black/20 max-w-sm">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.icon === "star" ? "bg-yellow-400" : "bg-primary"}`}>
              {toast.icon === "star" ? <Star size={14} aria-hidden="true" /> : <Home size={14} aria-hidden="true" />}
            </div>
            <p className="text-sm font-medium">{toast.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
