"use client";

import { useState, useEffect } from "react";
import {
  Plus, Pencil, Trash2, X, Loader2, Star, Power, Tag,
  Sparkles, Gem, Palette, Eye, Scissors, Heart, Wand2, Brush,
  Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  popular: boolean;
  iconName: string | null;
  sortOrder: number;
  availableDays: string;
  timeSlots: string;
};

type FormState = {
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  popular: boolean;
  iconName: string;
  availableDays: number[];
  timeSlots: string[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6];
const DEFAULT_TIMES = ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: 0,
  isActive: true,
  popular: false,
  iconName: "",
  availableDays: DEFAULT_DAYS,
  timeSlots: DEFAULT_TIMES,
};

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

function formFromService(s: Service): FormState {
  return {
    name: s.name,
    description: s.description ?? "",
    price: s.price,
    isActive: s.isActive,
    popular: s.popular,
    iconName: s.iconName ?? "",
    availableDays: s.availableDays ? parseDays(s.availableDays) : DEFAULT_DAYS,
    timeSlots: s.timeSlots ? parseTimes(s.timeSlots) : DEFAULT_TIMES,
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTime, setNewTime] = useState("");

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

  useEffect(() => { fetchServices(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setNewTime("");
    setModal("create");
  };

  const openEdit = (s: Service) => {
    setForm(formFromService(s));
    setEditId(s.id);
    setNewTime("");
    setModal("edit");
  };

  const closeModal = () => setModal(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url =
      modal === "edit" ? `/api/admin/services/${editId}` : "/api/admin/services";
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      isActive: form.isActive,
      popular: form.popular,
      iconName: form.iconName,
      availableDays: form.availableDays.slice().sort((a, b) => a - b).join(","),
      timeSlots: sortTimes(form.timeSlots).join(","),
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
    await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, isActive: !s.isActive }),
    });
    fetchServices();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    fetchServices();
  };

  // Day toggle
  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  // Time slot management
  const addTime = () => {
    const t = newTime.trim();
    if (!t || form.timeSlots.includes(t)) return;
    setForm((prev) => ({
      ...prev,
      timeSlots: sortTimes([...prev.timeSlots, t]),
    }));
    setNewTime("");
  };

  const removeTime = (t: string) => {
    setForm((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((x) => x !== t),
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
          <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_120px_100px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide">
            <span className="w-9" />
            <span>Service</span>
            <span>Price</span>
            <span>Popular</span>
            <span>Status</span>
            <span>Actions</span>
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
              <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_120px_100px] gap-3 px-5 py-3.5 items-center">
                <div className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center shrink-0">
                  <IconComp size={16} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-sm text-glam-text">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted truncate max-w-xs">{s.description}</p>
                  )}
                </div>
                <span className="font-bold text-primary text-sm tabular-nums">{s.price} EGP</span>
                <div className="flex items-center">
                  {s.popular && (
                    <Star size={13} className="text-yellow-500 fill-yellow-400" aria-label="Popular" />
                  )}
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-150 w-fit cursor-pointer ${
                    s.isActive
                      ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500"
                      : "bg-red-50 text-red-400 border-red-100 hover:bg-red-400 hover:text-white hover:border-red-400"
                  }`}
                >
                  <Power size={11} aria-hidden="true" />
                  {s.isActive ? "Active" : "Inactive"}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(s)}
                    title="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    title="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {/* Mobile row */}
              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center shrink-0">
                  <IconComp size={16} className="text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-glam-text">{s.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {s.price} EGP{s.popular ? " · Popular" : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(s)}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border cursor-pointer transition-all duration-150 ${
                    s.isActive
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-red-50 text-red-400 border-red-100"
                  }`}
                >
                  <Power size={10} aria-hidden="true" /> {s.isActive ? "On" : "Off"}
                </button>
                <button
                  onClick={() => openEdit(s)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink cursor-pointer"
                >
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer"
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-serif font-bold text-glam-text">
                {modal === "create" ? "New Service" : "Edit Service"}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Modal body — scrollable */}
            <form
              onSubmit={handleSave}
              className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Classic Manicure"
                  className={INPUT}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description…"
                  className={INPUT}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">
                  Price (EGP) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="150"
                  className={INPUT}
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-glam-text">Mark as Popular</span>
                </label>
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

              {/* ── Icon picker ─────────────────────────────────────────── */}
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
                        onClick={() =>
                          setForm({ ...form, iconName: selected ? "" : name })
                        }
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

              {/* ── Available Days ───────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">
                  Available Days
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAY_LABELS.map((label, dayIndex) => {
                    const active = form.availableDays.includes(dayIndex);
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
              </div>

              {/* ── Time Slots ───────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">
                  Available Times
                </label>
                {/* Existing chips */}
                {form.timeSlots.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {form.timeSlots.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 bg-pastel-pink text-primary text-xs font-semibold px-2.5 py-1 rounded-full"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTime(t)}
                          aria-label={`Remove ${t}`}
                          className="text-primary/50 hover:text-primary transition-colors cursor-pointer"
                        >
                          <X size={11} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Add new time */}
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className={`${INPUT} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addTime}
                    disabled={!newTime}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all duration-150 disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all disabled:opacity-50 shadow-sm shadow-primary/20 cursor-pointer min-h-[48px]"
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
    </div>
  );
}
