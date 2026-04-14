"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { IoSearch, IoChevronBack, IoChevronForward } from "react-icons/io5";

import { createApiClient } from "@/lib/api";

type AdminUser = {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  created_at: string;
  total_trips: number;
  provider: string | null;
};

const ROLE_CLS: Record<string, string> = {
  admin: "bg-purple-50 text-purple-600 border-purple-100",
  user:  "bg-blue-50 text-blue-600 border-blue-100",
};
const STATUS_CLS: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: "Activo",   cls: "bg-green-50 text-green-600 border-green-100" },
  INACTIVE: { label: "Inactivo", cls: "bg-gray-50 text-gray-500 border-gray-200" },
  DELETED:  { label: "Eliminado",cls: "bg-red-50 text-red-500 border-red-100" },
};

const LIMIT = 10;

export default function UsersTable() {
  const { getToken } = useAuth();
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [query, setQuery]     = useState("");
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setQuery(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [page, query]);

  async function fetchUsers() {
    setLoading(true);
    const api = createApiClient(getToken);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (query) p.set("search", query);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/admin/users?${p}`);
      const d = data?.data ?? data;
      setUsers(d.users ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">Usuarios registrados</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} usuarios en total</p>
        </div>
        <div className="relative">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre..."
            className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              {["Usuario", "Nombre", "Rol", "Estado", "Viajes", "Provider", "Registro"].map((h) => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? "140px" : "80px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              : users.map((u) => {
                  const st = STATUS_CLS[u.status] ?? { label: u.status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
                  const initials = ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || u.email[0].toUpperCase();
                  return (
                    <tr key={u.user_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <span className="text-gray-500 text-xs max-w-[160px] truncate">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-700">
                        {u.first_name || u.last_name
                          ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_CLS[u.role] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 tabular-nums font-medium">{u.total_trips}</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs">{u.provider ?? "—"}</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <IoChevronBack className="text-sm" />
            </button>
            <span className="text-sm text-gray-600 px-2 tabular-nums">{page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors"
            >
              <IoChevronForward className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
