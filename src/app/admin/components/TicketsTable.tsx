"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { IoChevronBack, IoChevronForward, IoWalletOutline } from "react-icons/io5";

import { createApiClient } from "@/lib/api";

type AdminTicket = {
  ticket_id: string;
  trip_id: string;
  trip_name: string;
  user_email: string;
  total_budget: number;
  accumulated_cost: number;
  available_balance: number;
  budget_status: string;
  total_places: number;
  total_flights: number;
  total_items: number;
};

const ESTADO_MAP: Record<string, { label: string; cls: string }> = {
  WITHIN_BUDGET: { label: "En rango",   cls: "bg-green-50 text-green-600 border-green-100" },
  WARNING:       { label: "Advertencia",cls: "bg-amber-50 text-amber-600 border-amber-100" },
  OVER_BUDGET:   { label: "Excedido",   cls: "bg-red-50 text-red-500 border-red-100" },
  WITHOUT_DATA:  { label: "Sin datos",  cls: "bg-gray-50 text-gray-400 border-gray-200" },
};

const FILTERS = [
  { k: "",              label: "Todos" },
  { k: "WITHIN_BUDGET", label: "En rango" },
  { k: "WARNING",       label: "Advertencia" },
  { k: "OVER_BUDGET",   label: "Excedido" },
  { k: "WITHOUT_DATA",  label: "Sin datos" },
];

const LIMIT = 10;

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `$${(n).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function TicketsTable() {
  const { getToken } = useAuth();
  const [tickets, setTickets]   = useState<AdminTicket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [estado, setEstado]     = useState("");
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  useEffect(() => { setPage(1); }, [estado]);
  useEffect(() => { fetchTickets(); }, [page, estado]);

  async function fetchTickets() {
    setLoading(true);
    const api = createApiClient(getToken);
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (estado) p.set("estado", estado);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(`/api/v1/admin/tickets?${p}`);
      const d = data?.data ?? data;
      setTickets(d.tickets ?? []);
      setTotal(d.total ?? 0);
    } catch {
      setTickets([]);
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
          <h2 className="font-semibold text-gray-800">Presupuestos</h2>
          <p className="text-xs text-gray-400 mt-0.5">{total} tickets de presupuesto</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.k}
              onClick={() => setEstado(f.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                estado === f.k
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
              {["Viaje", "Usuario", "Presupuesto", "Costo acumulado", "Balance", "Items", "Estado"].map((h) => (
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
              : tickets.map((t) => {
                  const est = ESTADO_MAP[t.budget_status] ?? { label: t.budget_status, cls: "bg-gray-50 text-gray-400 border-gray-200" };
                  const pct = t.total_budget > 0
                    ? Math.min(100, Math.round((t.accumulated_cost / t.total_budget) * 100))
                    : 0;
                  const barColor = t.budget_status === "OVER_BUDGET"
                    ? "#ef4444"
                    : t.budget_status === "WARNING"
                    ? "#f59e0b"
                    : "#22c55e";

                  return (
                    <tr key={t.ticket_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <IoWalletOutline className="text-gray-300 flex-shrink-0" />
                          <span className="font-medium text-gray-800 max-w-[130px] truncate">{t.trip_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs max-w-[140px] truncate">{t.user_email}</td>
                      <td className="px-6 py-3.5 text-gray-700 tabular-nums font-medium">{fmt(t.total_budget)}</td>
                      <td className="px-6 py-3.5">
                        <div className="space-y-1">
                          <span className="text-gray-700 tabular-nums font-medium">{fmt(t.accumulated_cost)}</span>
                          {t.total_budget > 0 && (
                            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-3.5 tabular-nums font-medium ${(t.available_balance ?? 0) < 0 ? "text-red-500" : "text-gray-700"}`}>
                        {fmt(t.available_balance)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs tabular-nums">
                        <span>{t.total_items ?? 0} total</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span>{t.total_flights ?? 0} vuelos</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${est.cls}`}>
                          {est.label}
                        </span>
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
