"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

type AdminHypothesis = {
  trip_id: string;
  trip_name: string;
  status: string;
  planning_time_seconds: number;
  horas_planificacion: number;
  total_items_planificados: number;
  resultado_hipotesis: string;
  user_email: string;
};

const RESULTADO_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  VALIDADA:    { label: "Validada",    cls: "bg-green-50 text-green-600 border-green-100",  dot: "#22c55e" },
  NO_VALIDADA: { label: "No validada", cls: "bg-red-50 text-red-500 border-red-100",        dot: "#ef4444" },
  PENDIENTE:   { label: "Pendiente",   cls: "bg-amber-50 text-amber-600 border-amber-100",  dot: "#f59e0b" },
};

const TRIP_STATUS: Record<string, string> = {
  DRAFT:      "Borrador",
  CONFIRMED:  "Confirmado",
  COMPLETED:  "Completado",
  CANCELLED:  "Cancelado",
};

const FILTERS = [
  { k: "",            label: "Todos" },
  { k: "VALIDADA",    label: "Validadas" },
  { k: "NO_VALIDADA", label: "No validadas" },
  { k: "PENDIENTE",   label: "Pendientes" },
];

export default function HypothesisTable() {
  const { getToken } = useAuth();
  const [rows, setRows]           = useState<AdminHypothesis[]>([]);
  const [filtered, setFiltered]   = useState<AdminHypothesis[]>([]);
  const [loading, setLoading]     = useState(true);
  const [resultado, setResultado] = useState("");

  useEffect(() => { fetchHypothesis(); }, []);

  useEffect(() => {
    setFiltered(resultado ? rows.filter((r) => r.resultado_hipotesis === resultado) : rows);
  }, [resultado, rows]);

  async function fetchHypothesis() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/api/v1/admin/hypothesis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data?.data ?? data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const validadas   = rows.filter((r) => r.resultado_hipotesis === "VALIDADA").length;
  const noValidadas = rows.filter((r) => r.resultado_hipotesis === "NO_VALIDADA").length;
  const pendientes  = rows.filter((r) => r.resultado_hipotesis === "PENDIENTE").length;
  const pct = rows.length > 0 ? Math.round((validadas / rows.length) * 100) : 0;

  return (
    <div className="space-y-4">

      {/* Summary mini-cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: rows.length, color: "#6b7280", bg: "bg-gray-50" },
          { label: "Validadas",    value: validadas,   color: "#22c55e", bg: "bg-green-50" },
          { label: "No validadas", value: noValidadas, color: "#ef4444", bg: "bg-red-50" },
          { label: "Pendientes",   value: pendientes,  color: "#f59e0b", bg: "bg-amber-50" },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 border border-white`}>
            <p className="text-2xl font-black tabular-nums" style={{ color: c.color }}>{c.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600 font-medium">Tasa de validación</span>
            <span className="font-bold text-gray-800 tabular-nums">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-green-400 to-green-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{validadas} de {rows.length} viajes validaron la hipótesis</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Hipótesis de planificación</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Usuarios que planifican &gt;2h agregan más de 5 items
            </p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.k}
                onClick={() => setResultado(f.k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  resultado === f.k
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                {["Viaje", "Usuario", "Estado viaje", "Horas planif.", "Items planif.", "Resultado"].map((h) => (
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
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((r, i) => {
                    const res = RESULTADO_MAP[r.resultado_hipotesis] ?? { label: r.resultado_hipotesis, cls: "bg-gray-50 text-gray-400 border-gray-200", dot: "#9ca3af" };
                    const hours = r.horas_planificacion?.toFixed?.(1) ?? (r.planning_time_seconds ? (r.planning_time_seconds / 3600).toFixed(1) : "—");
                    return (
                      <tr key={r.trip_id ?? i} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[150px] truncate">{r.trip_name}</td>
                        <td className="px-6 py-3.5 text-gray-400 text-xs max-w-[160px] truncate">{r.user_email}</td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {TRIP_STATUS[r.status] ?? r.status}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums text-gray-700 font-medium">{hours}h</span>
                            {/* mini bar */}
                            <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${Math.min(100, (parseFloat(String(hours)) / 10) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-gray-700 tabular-nums font-medium">
                          {r.total_items_planificados}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: res.dot }} />
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${res.cls}`}>
                              {res.label}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
              }
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No hay datos para este filtro
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
