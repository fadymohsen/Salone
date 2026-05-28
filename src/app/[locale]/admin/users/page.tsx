"use client";

import { useState, useEffect } from "react";
import { Users, Star, CalendarDays, Loader2, Mail, Phone, X, MessageCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";

type Booking = {
  id: string; serviceType: string; bookingDate: string; bookingTime: string;
  status: string; paymentStatus: string; paymentMethod: string | null; amount: number | null; createdAt: string;
};

type UserRow = {
  id: string; name: string; email: string; phone: string | null;
  points: number; createdAt: string; _count: { bookings: number }; bookings: Booking[];
};

const STATUS_STYLES: Record<string, string> = {
  booked: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  missed: "bg-orange-50 text-orange-500 border-orange-100",
};

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  booked: Clock,
  confirmed: CheckCircle2,
  completed: CheckCircle2,
  cancelled: XCircle,
  missed: XCircle,
};

export default function UsersPage() {
  const t = useDictionary();
  const u = t.admin.usersPage;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [bookingsPopup, setBookingsPopup] = useState<UserRow | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((usr) =>
    usr.name.toLowerCase().includes(search.toLowerCase()) ||
    usr.email.toLowerCase().includes(search.toLowerCase()) ||
    (usr.phone && usr.phone.includes(search))
  );

  const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
  const mailLink = (email: string) => `mailto:${email}`;

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-glam-text">{u.title}</h1>
          <p className="text-sm text-muted mt-0.5">{u.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 bg-pastel-pink/50 px-4 py-2 rounded-xl border border-primary/10">
          <Users size={14} className="text-primary" aria-hidden="true" />
          <span className="text-sm font-bold text-primary">{users.length} {u.total}</span>
        </div>
      </div>

      <input type="search" placeholder={u.searchPlaceholder} value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-glam-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150" />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted text-sm">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t.common.loading}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <Users size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-sm text-muted">{search ? u.noMatch : u.noClients}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_80px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide">
            <span className="w-9" />
            <span>{u.client}</span>
            <span className="text-center">{u.contact}</span>
            <span className="text-center">{u.pointsCol}</span>
            <span className="text-center">{u.bookingsCol}</span>
          </div>

          {filtered.map((usr) => (
            <div key={usr.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[auto_1fr_100px_80px_80px] gap-3 px-5 py-3.5 items-center">
                <button onClick={() => setSelectedUser(usr)}
                  className="w-9 h-9 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold text-sm shrink-0 cursor-pointer hover:bg-primary hover:text-white transition-all duration-150">
                  {usr.name[0].toUpperCase()}
                </button>
                <button onClick={() => setSelectedUser(usr)} className="min-w-0 text-start cursor-pointer">
                  <p className="font-bold text-sm text-glam-text truncate hover:text-primary transition-colors">{usr.name}</p>
                </button>
                <div className="flex items-center justify-center gap-1.5">
                  {usr.phone && (
                    <a href={waLink(usr.phone)} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-all duration-150 cursor-pointer" title="WhatsApp">
                      <MessageCircle size={14} aria-hidden="true" />
                    </a>
                  )}
                  <a href={mailLink(usr.email)} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-150 cursor-pointer" title="Email">
                    <Mail size={14} aria-hidden="true" />
                  </a>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Star size={12} className="text-primary" aria-hidden="true" />
                  <span className="font-bold text-sm text-glam-text tabular-nums">{usr.points}</span>
                </div>
                <button onClick={() => setBookingsPopup(usr)}
                  className="flex items-center justify-center gap-1 cursor-pointer hover:text-primary transition-colors duration-150">
                  <CalendarDays size={12} className="text-muted" aria-hidden="true" />
                  <span className="text-sm text-muted tabular-nums font-bold hover:text-primary">{usr._count.bookings}</span>
                </button>
              </div>

              {/* Mobile row */}
              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <button onClick={() => setSelectedUser(usr)}
                  className="w-10 h-10 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold shrink-0 cursor-pointer">
                  {usr.name[0].toUpperCase()}
                </button>
                <button onClick={() => setSelectedUser(usr)} className="flex-1 min-w-0 text-start cursor-pointer">
                  <p className="font-bold text-sm text-glam-text truncate">{usr.name}</p>
                  <p className="text-xs text-muted truncate">{usr.email}</p>
                </button>
                <div className="flex items-center gap-1.5 shrink-0">
                  {usr.phone && (
                    <a href={waLink(usr.phone)} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 cursor-pointer">
                      <MessageCircle size={13} aria-hidden="true" />
                    </a>
                  )}
                  <button onClick={() => setBookingsPopup(usr)}
                    className="flex items-center gap-0.5 bg-pastel-pink px-2 py-1 rounded-lg cursor-pointer">
                    <CalendarDays size={11} className="text-primary" aria-hidden="true" />
                    <span className="text-xs font-bold text-primary">{usr._count.bookings}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-serif font-bold text-glam-text">Client Details</h2>
              <button onClick={() => setSelectedUser(null)} aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-pastel-pink flex items-center justify-center text-primary font-bold text-xl font-serif shrink-0">
                  {selectedUser.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-glam-text text-lg">{selectedUser.name}</p>
                  <p className="text-xs text-muted truncate">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-xs text-muted">{selectedUser.phone}</p>}
                  <p className="text-xs text-muted mt-0.5">Joined {new Date(selectedUser.createdAt).toLocaleDateString("en-EG", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">Points</p>
                  <p className="font-serif text-2xl font-bold text-glam-text">{selectedUser.points}</p>
                </div>
                <div className="bg-gradient-to-br from-secondary/8 to-secondary/3 rounded-2xl px-4 py-3 text-center">
                  <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">Bookings</p>
                  <p className="font-serif text-2xl font-bold text-glam-text">{selectedUser._count.bookings}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                {selectedUser.phone && (
                  <a href={waLink(selectedUser.phone)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-all duration-150 cursor-pointer text-sm">
                    <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                  </a>
                )}
                <a href={mailLink(selectedUser.email)} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-all duration-150 cursor-pointer text-sm">
                  <Mail size={15} aria-hidden="true" /> Email
                </a>
                {selectedUser.phone && (
                  <a href={`tel:${selectedUser.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-all duration-150 cursor-pointer text-sm">
                    <Phone size={15} aria-hidden="true" /> Call
                  </a>
                )}
              </div>

              {/* Bookings */}
              {selectedUser.bookings.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-glam-text uppercase tracking-wide mb-3">All Bookings</p>
                  <div className="space-y-2">
                    {selectedUser.bookings.map((b) => {
                      const StatusIcon = STATUS_ICON[b.status] ?? Clock;
                      return (
                        <div key={b.id} className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                          <StatusIcon size={15} className={b.status === "completed" ? "text-green-500" : b.status === "confirmed" ? "text-blue-500" : b.status === "cancelled" ? "text-red-400" : b.status === "missed" ? "text-orange-500" : "text-amber-500"} aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            {b.paymentMethod === "points" && (
                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mb-0.5">
                                <Star size={9} aria-hidden="true" /> Loyalty Program
                              </span>
                            )}
                            <p className="text-sm font-bold text-glam-text truncate">{b.serviceType}</p>
                            <p className="text-xs text-muted">{b.bookingDate} · {b.bookingTime}</p>
                          </div>
                          <div className="text-end shrink-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                              {b.status}
                            </span>
                            {b.amount != null && <p className="text-xs text-muted mt-0.5">{b.amount} EGP</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Popup (from clicking booking count) */}
      {bookingsPopup && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setBookingsPopup(null); }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif font-bold text-glam-text">{bookingsPopup.name}</h2>
                <p className="text-xs text-muted">{bookingsPopup._count.bookings} bookings</p>
              </div>
              <button onClick={() => setBookingsPopup(null)} aria-label="Close"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              {bookingsPopup.bookings.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarDays size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
                  <p className="text-sm text-muted">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookingsPopup.bookings.map((b) => {
                    const StatusIcon = STATUS_ICON[b.status] ?? Clock;
                    return (
                      <div key={b.id} className="flex items-center gap-3 bg-background rounded-xl px-4 py-3 border border-border">
                        <StatusIcon size={15} className={b.status === "completed" ? "text-green-500" : b.status === "cancelled" ? "text-red-400" : "text-blue-500"} aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          {b.paymentMethod === "points" && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mb-0.5">
                              <Star size={9} aria-hidden="true" /> Loyalty Program
                            </span>
                          )}
                          <p className="text-sm font-bold text-glam-text truncate">{b.serviceType}</p>
                          <p className="text-xs text-muted">{b.bookingDate} · {b.bookingTime}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                            {b.status}
                          </span>
                          {b.amount != null && <p className="text-xs text-muted mt-0.5">{b.amount} EGP</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
