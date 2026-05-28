"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, SlidersHorizontal, AlertTriangle } from "lucide-react";

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

type CategoryOption = { id: string; name: string };
type ServiceOption = { id: string; name: string; categoryId: string | null };

const TIMES = ["11:00", "12:30", "14:00", "15:30", "17:00", "18:30", "20:00"];
const STATUSES = ["booked", "confirmed", "completed", "cancelled", "missed"];

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  missed: "bg-orange-50 text-orange-500 border-orange-100",
};

const EMPTY: Booking = { id: "", clientName: "", clientPhone: "", clientEmail: "", serviceType: "", bookingDate: "", bookingTime: "11:00", status: "booked", notes: "", promoCode: "" };

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
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");

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

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then(r => r.json()),
      fetch("/api/admin/services").then(r => r.json()),
    ]).then(([cData, sData]) => {
      setCategories(Array.isArray(cData) ? cData : []);
      setServices(Array.isArray(sData) ? sData : []);
    });
  }, []);

  const openCreate = () => { setForm(EMPTY); setSelectedCategory(""); setModal("create"); };
  const openEdit = (b: Booking) => {
    setForm(b);
    const svc = services.find(s => s.name === b.serviceType);
    setSelectedCategory(svc?.categoryId ?? "");
    setModal("edit");
  };
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
        setToast(d.error ?? "Save failed. Check all fields.");
        setTimeout(() => setToast(null), 3000);
      }
    } catch {
      setToast("Network error. Please try again.");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (booking: Booking) => {
    await fetch(`/api/admin/bookings/${booking.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    fetchBookings();
  };

  const hasFilters = search || filterDate || filterService || filterStatus;

  return (
    <div className="space-y-4">
      {/* New Booking button — top right */}
      <div className="flex justify-end -mt-12">
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-primary text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-secondary transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer min-h-[44px]"
        >
          <Plus size={15} aria-hidden="true" />
          New Booking
        </button>
      </div>

      {/* Search — full width row */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150"
        />
      </div>

      {/* Filters — separate row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted shrink-0">
          <SlidersHorizontal size={14} aria-hidden="true" />
          <span className="text-xs font-bold">Filters</span>
        </div>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="flex-1 min-w-[140px] bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer"
        />
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="flex-1 min-w-[140px] bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer appearance-none"
        >
          <option value="">All Services</option>
          {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="flex-1 min-w-[120px] bg-white border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150 cursor-pointer appearance-none"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} className="capitalize">{s}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilterDate(""); setFilterService(""); setFilterStatus(""); }}
            className="flex items-center gap-1 text-xs text-muted hover:text-primary font-bold px-3 py-2.5 rounded-xl border border-border hover:border-primary/40 transition-all duration-150 cursor-pointer"
          >
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
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
                    onClick={() => setConfirmDelete(b)}
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
                    <button onClick={() => setConfirmDelete(b)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 bg-red-50 cursor-pointer">
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

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-glam-text/70 mb-2">Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((c) => (
                    <button key={c.id} type="button"
                      onClick={() => { setSelectedCategory(c.id); setForm({ ...form, serviceType: "" }); }}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold text-center transition-all duration-150 cursor-pointer min-h-[44px] ${
                        selectedCategory === c.id
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                          : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                      }`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service */}
              {selectedCategory && (
                <div>
                  <label className="block text-xs font-bold text-glam-text/70 mb-2">Service *</label>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {services.filter(s => s.categoryId === selectedCategory).map((s) => (
                      <button key={s.id} type="button"
                        onClick={() => setForm({ ...form, serviceType: s.name })}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-start text-sm font-medium transition-all duration-150 cursor-pointer min-h-[48px] ${
                          form.serviceType === s.name
                            ? "border-primary ring-2 ring-primary/15 bg-primary/5 text-primary font-bold"
                            : "border-border bg-background text-glam-text hover:border-primary/40"
                        }`}>
                        <span>{s.name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          form.serviceType === s.name ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {form.serviceType === s.name && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Branded Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={20} className="text-red-500" aria-hidden="true" />
              </div>
              <div>
                <p className="font-serif font-bold text-glam-text">Delete Booking</p>
                <p className="text-sm text-muted mt-0.5">Cancel <strong className="text-glam-text">{confirmDelete.clientName}</strong>&apos;s booking for <strong className="text-glam-text">{confirmDelete.serviceType}</strong>?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[48px]">
                Keep
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
    </div>
  );
}
