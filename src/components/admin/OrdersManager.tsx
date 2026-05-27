"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, SlidersHorizontal } from "lucide-react";

type Booking = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  serviceType: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  notes: string | null;
  promoCode: string | null;
};

const SERVICES = ["Classic Manicure", "French Rose Acrylics", "Glazed Donut Nails", "Vanilla Velvet Set", "Lash Lift & Glow"];
const TIMES = ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];
const STATUSES = ["confirmed", "completed", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

const EMPTY: Booking = { id: "", clientName: "", clientPhone: "", clientEmail: "", serviceType: "Classic Manicure", bookingDate: "", bookingTime: "11:00", status: "confirmed", notes: "", promoCode: "" };

const INPUT_CLS = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";

export default function OrdersManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Booking>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterDate) params.set("date", filterDate);
    if (filterService) params.set("service", filterService);
    if (filterStatus) params.set("status", filterStatus);
    try {
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterDate, filterService, filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const openCreate = () => { setForm(EMPTY); setModal("create"); };
  const openEdit = (b: Booking) => { setForm(b); setModal("edit"); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const isEdit = modal === "edit";
      const res = await fetch(
        isEdit ? `/api/admin/bookings/${form.id}` : "/api/admin/bookings",
        { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      if (res.ok) { closeModal(); fetchBookings(); }
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Save failed. Check all fields.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Cancel ${name}'s booking?`)) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    fetchBookings();
  };

  const hasFilters = search || filterDate || filterService || filterStatus;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 text-muted shrink-0">
          <SlidersHorizontal size={14} aria-hidden="true" />
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
        />
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
        >
          <option value="">All Services</option>
          {SERVICES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} className="capitalize">{s}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterDate(""); setFilterService(""); setFilterStatus(""); }}
            className="flex items-center gap-1 text-xs text-muted hover:text-primary font-bold px-2 py-2 transition-colors duration-150 cursor-pointer"
          >
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]"
        >
          <Plus size={15} aria-hidden="true" />
          New Booking
        </button>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-muted font-medium">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} found</p>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading…
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm bg-white rounded-2xl border border-border">
          <Search size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          No bookings match your filters
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[80px_1fr_1fr_100px_110px_96px] gap-3 px-4 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide">
            <span>Time</span><span>Client</span><span>Service</span><span>Date</span><span>Status</span><span>Actions</span>
          </div>

          {bookings.map((b) => (
            <div key={b.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[80px_1fr_1fr_100px_110px_96px] gap-3 px-4 py-3 items-center">
                <span className="font-bold text-sm text-glam-text">{b.bookingTime}</span>
                <div>
                  <p className="font-bold text-sm text-glam-text">{b.clientName}</p>
                  <p className="text-xs text-muted">{b.clientPhone}{b.clientEmail ? ` · ${b.clientEmail}` : ""}</p>
                </div>
                <span className="text-sm text-glam-text/70 truncate">{b.serviceType}</span>
                <span className="text-sm text-muted">{b.bookingDate}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize w-fit ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                  {b.status}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(b)}
                    title="Edit booking"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.clientName)}
                    title="Delete booking"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-150 cursor-pointer"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-pastel-pink text-primary font-bold text-xs px-2.5 py-1 rounded-lg">{b.bookingTime}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>{b.status}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(b)} className="w-8 h-8 flex items-center justify-center rounded-lg text-primary bg-pastel-pink cursor-pointer">
                      <Pencil size={13} aria-hidden="true" />
                    </button>
                    <button onClick={() => handleDelete(b.id, b.clientName)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer">
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <p className="font-bold text-sm text-glam-text">{b.clientName} · {b.bookingDate}</p>
                <p className="text-xs text-muted">{b.serviceType} · {b.clientPhone}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="font-serif font-bold text-glam-text">{modal === "create" ? "New Booking" : "Edit Booking"}</h2>
              <button
                onClick={closeModal}
                aria-label="Close modal"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all duration-150 cursor-pointer"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { key: "clientName", label: "Name *", type: "text", placeholder: "Farida Amin" },
                { key: "clientPhone", label: "Phone *", type: "tel", placeholder: "010XXXXXXXX" },
                { key: "clientEmail", label: "Email", type: "email", placeholder: "client@example.com" },
                { key: "bookingDate", label: "Date *", type: "date", placeholder: "" },
                { key: "promoCode", label: "Promo Code", type: "text", placeholder: "GLOW20" },
                { key: "notes", label: "Notes", type: "text", placeholder: "Any special requests…" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-glam-text/70 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(form as Record<string, string>)[key] ?? ""}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={INPUT_CLS}
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Service *</label>
                <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className={`${INPUT_CLS} cursor-pointer`}>
                  {SERVICES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">Time *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIMES.map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, bookingTime: t })}
                      className={`py-2.5 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer min-h-[44px] ${form.bookingTime === t ? "bg-primary text-white border-primary shadow-sm shadow-primary/25" : "border-border text-glam-text hover:border-primary/50 hover:text-primary"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {modal === "edit" && (
                <div>
                  <label className="block text-xs font-bold text-glam-text/70 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={`${INPUT_CLS} capitalize cursor-pointer`}>
                    {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all duration-150 cursor-pointer min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all duration-150 disabled:opacity-50 shadow-sm shadow-primary/20 cursor-pointer min-h-[48px]"
              >
                {saving ? (
                  <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving…</>
                ) : modal === "create" ? "Create Booking" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
