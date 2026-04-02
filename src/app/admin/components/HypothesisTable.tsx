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
  "HIPÓTESIS VALIDADA":   { label: "Validada",    cls: "bg-green-50 text-green-600 border-green-100",  dot: "#22c55e" },
  "HIPÓTESIS INVALIDADA": { label: "No validada", cls: "bg-red-50 text-red-500 border-red-100",        dot: "#ef4444" },
  VALIDADA:               { label: "Validada",    cls: "bg-green-50 text-green-600 border-green-100",  dot: "#22c55e" },
  NO_VALIDADA:            { label: "No validada", cls: "bg-red-50 text-red-500 border-red-100",        dot: "#ef4444" },
  PENDIENTE:              { label: "Pendiente",   cls: "bg-amber-50 text-amber-600 border-amber-100",  dot: "#f59e0b" },
};

const TRIP_STATUS: Record<string, string> = {
  DRAFT:      "Borrador",
  CONFIRMED:  "Confirmado",
  COMPLETED:  "Completado",
  CANCELLED:  "Cancelado",
};

const FILTERS = [
  { k: "",                     label: "Todos" },
  { k: "HIPÓTESIS VALIDADA",   label: "Validadas" },
  { k: "HIPÓTESIS INVALIDADA", label: "No validadas" },
  { k: "PENDIENTE",            label: "Pendientes" },
];

const THRESHOLD = 2.5;

/* ─── Scatter Plot ──────────────────────────────────────────────────── */
function ScatterPlot({ rows }: { rows: AdminHypothesis[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; row: AdminHypothesis } | null>(null);

  const W = 500, H = 300, PAD = { top: 16, right: 16, bottom: 40, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxX = Math.max(...rows.map((r) => Number(r.horas_planificacion)), THRESHOLD + 1, 5);
  const maxY = Math.max(...rows.map((r) => Number(r.total_items_planificados)), 10);

  const toSvgX = (h: number) => (Number(h) / maxX) * innerW;
  const toSvgY = (v: number) => innerH - (Number(v) / maxY) * innerH;

  const thresholdX = toSvgX(THRESHOLD);

  const xTicks = Array.from({ length: 6 }, (_, i) => parseFloat(((maxX / 5) * i).toFixed(1)));
  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxY / 4) * i));

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Horas de planificación vs. Items planificados</h3>
        <p className="text-xs text-gray-400 mt-0.5">Cada punto es un viaje — línea roja = umbral 2.5h</p>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
          <g transform={`translate(${PAD.left},${PAD.top})`}>

            {/* Grid lines Y */}
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={0} y1={toSvgY(v)} x2={innerW} y2={toSvgY(v)} stroke="#f3f4f6" strokeWidth={1} />
                <text x={-6} y={toSvgY(v)} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize={9}>
                  {v}
                </text>
              </g>
            ))}

            {/* Grid lines X */}
            {xTicks.map((v) => (
              <g key={v}>
                <line x1={toSvgX(v)} y1={0} x2={toSvgX(v)} y2={innerH} stroke="#f3f4f6" strokeWidth={1} />
                <text x={toSvgX(v)} y={innerH + 12} textAnchor="middle" fill="#9ca3af" fontSize={9}>
                  {v}h
                </text>
              </g>
            ))}

            {/* Threshold line */}
            <line x1={thresholdX} y1={0} x2={thresholdX} y2={innerH} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={thresholdX + 4} y={8} fill="#ef4444" fontSize={9} fontWeight={600}>2.5h</text>

            {/* Axes */}
            <line x1={0} y1={0} x2={0} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />
            <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />

            {/* Points */}
            {rows.map((r, i) => {
              const cx = toSvgX(Number(r.horas_planificacion));
              const cy = toSvgY(Number(r.total_items_planificados));
              const validated = r.resultado_hipotesis === "HIPÓTESIS VALIDADA" || r.resultado_hipotesis === "VALIDADA";
              const color = validated ? "#22c55e" : "#ef4444";
              return (
                <circle
                  key={r.trip_id ?? i}
                  cx={cx} cy={cy} r={5}
                  fill={color} fillOpacity={0.75}
                  stroke={color} strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const svgRect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setTooltip({ x: e.clientX - svgRect.left, y: e.clientY - svgRect.top, row: r });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-10 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 pointer-events-none shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10, maxWidth: 200 }}
          >
            <p className="font-semibold truncate">{tooltip.row.trip_name}</p>
            <p className="text-gray-300">{Number(tooltip.row.horas_planificacion).toFixed(2)}h · {tooltip.row.total_items_planificados} items</p>
            <p style={{ color: RESULTADO_MAP[tooltip.row.resultado_hipotesis]?.dot ?? "#9ca3af" }}>
              {RESULTADO_MAP[tooltip.row.resultado_hipotesis]?.label ?? tooltip.row.resultado_hipotesis}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        {[
          { color: "#22c55e", label: "Hipótesis validada" },
          { color: "#ef4444", label: "Hipótesis no validada" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Histogram ─────────────────────────────────────────────────────── */
function Histogram({ rows }: { rows: AdminHypothesis[] }) {
  const W = 500, H = 260, PAD = { top: 16, right: 16, bottom: 40, left: 44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const BIN_SIZE = 0.5;
  const maxHours = Math.max(...rows.map((r) => Number(r.horas_planificacion)), THRESHOLD + 1, 5);
  const numBins = Math.ceil(maxHours / BIN_SIZE);

  const bins = Array.from({ length: numBins }, (_, i) => ({
    from: i * BIN_SIZE,
    to: (i + 1) * BIN_SIZE,
    validated: 0,
    invalidated: 0,
  }));

  rows.forEach((r) => {
    const h = Number(r.horas_planificacion);
    const idx = Math.min(Math.floor(h / BIN_SIZE), numBins - 1);
    const validated = r.resultado_hipotesis === "HIPÓTESIS VALIDADA" || r.resultado_hipotesis === "VALIDADA";
    if (validated) bins[idx].validated++;
    else bins[idx].invalidated++;
  });

  const maxCount = Math.max(...bins.map((b) => b.validated + b.invalidated), 1);
  const barW = innerW / numBins;
  const thresholdX = (THRESHOLD / (numBins * BIN_SIZE)) * innerW;

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxCount / 4) * i));

  if (rows.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Distribución de horas de planificación</h3>
        <p className="text-xs text-gray-400 mt-0.5">Cantidad de viajes por rango de horas — línea roja = umbral 2.5h</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320 }}>
        <g transform={`translate(${PAD.left},${PAD.top})`}>

          {/* Grid Y */}
          {yTicks.map((v) => {
            const y = innerH - (v / maxCount) * innerH;
            return (
              <g key={v}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize={9}>{v}</text>
              </g>
            );
          })}

          {/* Bars */}
          {bins.map((bin, i) => {
            const total = bin.validated + bin.invalidated;
            const totalH = (total / maxCount) * innerH;
            const validH = (bin.validated / maxCount) * innerH;
            const x = i * barW;
            const gap = barW > 6 ? 2 : 0.5;
            return (
              <g key={i}>
                {/* invalidated (bottom) */}
                {bin.invalidated > 0 && (
                  <rect
                    x={x + gap / 2} y={innerH - totalH + validH}
                    width={barW - gap} height={totalH - validH}
                    fill="#ef4444" fillOpacity={0.6} rx={2}
                  />
                )}
                {/* validated (top) */}
                {bin.validated > 0 && (
                  <rect
                    x={x + gap / 2} y={innerH - totalH}
                    width={barW - gap} height={validH}
                    fill="#22c55e" fillOpacity={0.7} rx={2}
                  />
                )}
              </g>
            );
          })}

          {/* X axis labels */}
          {bins.filter((_, i) => i % 2 === 0).map((bin, i) => (
            <text key={i} x={i * 2 * barW + barW} y={innerH + 12} textAnchor="middle" fill="#9ca3af" fontSize={9}>
              {bin.from.toFixed(1)}h
            </text>
          ))}

          {/* Threshold line */}
          <line x1={thresholdX} y1={0} x2={thresholdX} y2={innerH} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={thresholdX + 4} y={8} fill="#ef4444" fontSize={9} fontWeight={600}>2.5h</text>

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="#e5e7eb" strokeWidth={1} />
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        {[
          { color: "#22c55e", label: "Validada (≤2.5h)" },
          { color: "#ef4444", label: "No validada (>2.5h)" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────── */
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

  const validadas   = rows.filter((r) => r.resultado_hipotesis === "HIPÓTESIS VALIDADA"   || r.resultado_hipotesis === "VALIDADA").length;
  const noValidadas = rows.filter((r) => r.resultado_hipotesis === "HIPÓTESIS INVALIDADA" || r.resultado_hipotesis === "NO_VALIDADA").length;
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

      {/* Charts */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScatterPlot rows={rows} />
          <Histogram rows={rows} />
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
