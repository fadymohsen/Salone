"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2, SlidersHorizontal, AlertTriangle, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

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

import { fmt12 } from "@/lib/fmt12";

export default function OrdersManager() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterServices, setFilterServices] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calView, setCalView] = useState(() => { const now = new Date(); return { y: now.getFullYear(), m: now.getMonth() }; });
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Booking>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Booking | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowServiceFilter(false);
        setShowStatusFilter(false);
        setShowDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterDate) params.set("date", filterDate);
    if (filterServices.length > 0) params.set("service", filterServices.join(","));
    if (filterStatuses.length > 0) params.set("status", filterStatuses.join(","));
    try {
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterDate, filterServices, filterStatuses]);

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

  const hasFilters = search || filterDate || filterServices.length > 0 || filterStatuses.length > 0;

  const toggleServiceFilter = (name: string) => {
    setFilterServices(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };
  const toggleStatusFilter = (status: string) => {
    setFilterStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

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

      {/* Filters — full width 3-column grid */}
      <div ref={filterRef} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-muted">
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span className="text-xs font-bold">Filters</span>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilterDate(""); setFilterServices([]); setFilterStatuses([]); }}
              className="flex items-center gap-1 text-xs text-muted hover:text-primary font-bold px-2 py-1 transition-colors cursor-pointer"
            >
              <X size={11} aria-hidden="true" /> Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Date picker */}
          <div className="relative">
            <button type="button" onClick={() => { setShowDatePicker(!showDatePicker); setShowServiceFilter(false); setShowStatusFilter(false); }}
              className={`w-full flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                filterDate ? "border-primary text-primary" : "border-border text-glam-text"
              }`}>
              <CalendarDays size={14} className="shrink-0 opacity-60" aria-hidden="true" />
              <span className="truncate">{filterDate || "All Dates"}</span>
            </button>
            {showDatePicker && (() => {
              const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
              const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
              const firstDow = new Date(calView.y, calView.m, 1).getDay();
              const daysInMonth = new Date(calView.y, calView.m + 1, 0).getDate();
              const toStr = (d: number) => `${calView.y}-${String(calView.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              return (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-2xl shadow-xl z-20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => setCalView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-pastel-pink hover:text-primary transition-all cursor-pointer">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-sm font-bold text-glam-text">{MONTHS[calView.m]} {calView.y}</span>
                    <button type="button" onClick={() => setCalView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-pastel-pink hover:text-primary transition-all cursor-pointer">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map(d => <span key={d} className="text-center text-xs font-bold text-muted/50 py-1">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-0.5">
                    {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1, dateStr = toStr(day);
                      const isSelected = filterDate === dateStr;
                      const isToday = dateStr === new Date().toISOString().split("T")[0];
                      return (
                        <button key={day} type="button"
                          onClick={() => { setFilterDate(isSelected ? "" : dateStr); setShowDatePicker(false); }}
                          className={`h-8 w-full rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isSelected ? "bg-primary text-white" : isToday ? "ring-2 ring-primary/40 text-primary font-bold" : "text-glam-text hover:bg-pastel-pink hover:text-primary"
                          }`}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  {filterDate && (
                    <button type="button" onClick={() => { setFilterDate(""); setShowDatePicker(false); }}
                      className="w-full text-xs font-bold text-muted hover:text-primary text-center py-2 mt-2 border-t border-border cursor-pointer transition-colors">
                      Clear date
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Services multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { setShowServiceFilter(!showServiceFilter); setShowStatusFilter(false); setShowDatePicker(false); }}
              className={`w-full flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                filterServices.length > 0 ? "border-primary text-primary" : "border-border text-glam-text"
              }`}>
              <span className="truncate flex-1 text-start">{filterServices.length > 0 ? `${filterServices.length} service${filterServices.length !== 1 ? "s" : ""}` : "All Services"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showServiceFilter && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                  {services.map(s => {
                    const checked = filterServices.includes(s.name);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleServiceFilter(s.name)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-start transition-all duration-150 cursor-pointer ${
                          checked ? "bg-primary/5 text-primary font-bold" : "text-glam-text hover:bg-pastel-pink"
                        }`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                          {checked && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className="truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
                {filterServices.length > 0 && (
                  <div className="border-t border-border p-2">
                    <button type="button" onClick={() => setFilterServices([])}
                      className="w-full text-xs font-bold text-muted hover:text-primary text-center py-1.5 cursor-pointer transition-colors">
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status multi-select */}
          <div className="relative">
            <button type="button" onClick={() => { setShowStatusFilter(!showStatusFilter); setShowServiceFilter(false); setShowDatePicker(false); }}
              className={`w-full flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer ${
                filterStatuses.length > 0 ? "border-primary text-primary" : "border-border text-glam-text"
              }`}>
              <span className="truncate flex-1 text-start">{filterStatuses.length > 0 ? `${filterStatuses.length} status${filterStatuses.length !== 1 ? "es" : ""}` : "All Status"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showStatusFilter && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-border rounded-2xl shadow-xl z-20 overflow-hidden">
                <div className="p-2 space-y-1">
                  {STATUSES.map(s => {
                    const checked = filterStatuses.includes(s);
                    return (
                      <button key={s} type="button" onClick={() => toggleStatusFilter(s)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-start transition-all duration-150 cursor-pointer capitalize ${
                          checked ? "bg-primary/5 text-primary font-bold" : "text-glam-text hover:bg-pastel-pink"
                        }`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                          {checked && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s]?.split(" ")[0] ?? "bg-gray-200"}`} />
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
                {filterStatuses.length > 0 && (
                  <div className="border-t border-border p-2">
                    <button type="button" onClick={() => setFilterStatuses([])}
                      className="w-full text-xs font-bold text-muted hover:text-primary text-center py-1.5 cursor-pointer transition-colors">
                      Clear selection
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
                <span className="font-bold text-sm text-glam-text">{fmt12(b.bookingTime)}</span>
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
                    <span className="bg-pastel-pink text-primary font-bold text-xs px-2.5 py-1 rounded-lg">{fmt12(b.bookingTime)}</span>
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
