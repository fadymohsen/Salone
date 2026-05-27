"use client";

import { useState, useEffect } from "react";
import { Users, Star, CalendarDays, Loader2, Mail, Phone } from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";

type UserRow = {
  id: string; name: string; email: string; phone: string | null;
  points: number; createdAt: string; _count: { bookings: number };
};

export default function UsersPage() {
  const t = useDictionary();
  const u = t.admin.usersPage;
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((usr) =>
    usr.name.toLowerCase().includes(search.toLowerCase()) ||
    usr.email.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="hidden md:grid grid-cols-[auto_1fr_140px_80px_80px] gap-3 px-5 py-2.5 bg-pastel-pink text-xs font-bold text-primary uppercase tracking-wide">
            <span className="w-9" />
            <span>{u.client}</span>
            <span>{u.contact}</span>
            <span>{u.pointsCol}</span>
            <span>{u.bookingsCol}</span>
          </div>
          {filtered.map((usr) => (
            <div key={usr.id} className="border-t border-border first:border-t-0 hover:bg-pastel-pink/20 transition-colors duration-100">
              <div className="hidden md:grid grid-cols-[auto_1fr_140px_80px_80px] gap-3 px-5 py-3.5 items-center">
                <div className="w-9 h-9 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {usr.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-glam-text truncate">{usr.name}</p>
                  <p className="text-xs text-muted truncate">{usr.email}</p>
                </div>
                <div className="space-y-0.5">
                  {usr.phone && <p className="text-xs text-muted flex items-center gap-1"><Phone size={10} aria-hidden="true" /> {usr.phone}</p>}
                  <p className="text-xs text-muted flex items-center gap-1">
                    <Mail size={10} aria-hidden="true" />
                    <span className="truncate">{new Date(usr.createdAt).toLocaleDateString("en-EG", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-primary" aria-hidden="true" />
                  <span className="font-bold text-sm text-glam-text tabular-nums">{usr.points}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-muted" aria-hidden="true" />
                  <span className="text-sm text-muted tabular-nums">{usr._count.bookings}</span>
                </div>
              </div>

              <div className="md:hidden px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold shrink-0">
                  {usr.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-glam-text truncate">{usr.name}</p>
                  <p className="text-xs text-muted truncate">{usr.email}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-xs font-bold text-primary flex items-center gap-0.5 justify-end">
                    <Star size={10} aria-hidden="true" /> {usr.points}
                  </p>
                  <p className="text-xs text-muted">{usr._count.bookings} {u.bookingsCol.toLowerCase()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
