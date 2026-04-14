"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

import { createApiClient } from "@/lib/api";

type AdminTrip = {
  trip_id: string;
  trip_name: string;
  status: string;
  user_email: string;
  destination_name: string;
  destination_image: string | null;
  total_items: number;
  planning_time_seconds: number;
  start_date: string;
  end_date: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:      { label: "Borrador",    cls: "bg-blue-50 text-blue-600 border-blue-100" },
  CONFIRMED:  { label: "Confirmado",  cls: "bg-green-50 text-green-600 border-green-100" },
  COMPLETED:  { label: "Completado",  cls: "bg-purple-50 text-purple-600 border-purple-100" },
  CANCELLED:  { label: "Cancelado",   cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const FILTERS = [
  { k: "",           label: "Todos" },
  { k: "DRAFT",      label: "Borrador" },
  { k: "CONFIRMED",  label: "Confirmado" },
  { k: "COMPLETED",  label: "Completado" },
  { k: "CANCELLED",  label: "Cancelado" },
];

const LIMIT = 10;

export default function TripsTable() {
  const { getToken } = useAuth();
  const [trips, setTrips]         = useState<AdminTrip[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState("");
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchTrips(); }, [page, statusFilter]);

  async function fetchTrips() {
    setLoading(true);
    const api = createApiClient(getToken);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter) p.set("status", statusFilter);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/admin/trips?${p}`);
      const d = data?.data ?? data;
      setTrips(d.trips ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setTrips([]);
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
          <h2 className="font-semibold text-gray-800">Viajes</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} viajes {statusFilter ? `en estado ${STATUS_MAP[statusFilter]?.label}` : "registrados"}</p>
        </div>
        {/* Status filter pills */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.k}
              onClick={() => setStatus(f.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === f.k
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              {["Viaje", "Destino", "Usuario", "Estado", "Items", "Planificación", "Fechas"].map((h) => (
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
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : trips.map((t) => {
                  const st = STATUS_MAP[t.status] ?? { label: t.status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
                  const hours = t.planning_time_seconds ? (t.planning_time_seconds / 3600).toFixed(1) : "—";
                  const start = t.start_date ? new Date(t.start_date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—";
                  const end   = t.end_date   ? new Date(t.end_date).toLocaleDateString("es-MX",   { day: "2-digit", month: "short", year: "2-digit" }) : "";
                  return (
                    <tr key={t.trip_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-blue-100">
                            {t.destination_image
                              ? <img src={t.destination_image} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
                            }
                          </div>
                          <span className="font-medium text-gray-800 max-w-[140px] truncate">{t.trip_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs max-w-[120px] truncate">{t.destination_name}</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs max-w-[140px] truncate">{t.user_email}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 tabular-nums font-medium">{t.total_items}</td>
                      <td className="px-6 py-3.5 text-gray-600 tabular-nums text-xs">{hours}h</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">{start}{end ? ` – ${end}` : ""}</td>
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
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
              <IoChevronBack className="text-sm" />
            </button>
            <span className="text-sm text-gray-600 px-2 tabular-nums">{page} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors">
              <IoChevronForward className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
