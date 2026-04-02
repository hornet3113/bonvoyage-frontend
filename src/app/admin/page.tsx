"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import {
  IoPeopleOutline, IoAirplaneOutline, IoCheckmarkCircleOutline,
  IoTimeOutline, IoCalendarOutline, IoAlertCircleOutline,
} from "react-icons/io5";
import { useUserProfile } from "@/hooks/useUserProfile";
import AvatarProfilePage from "../components/AvatarProfilePage";
import UsersTable from "./components/UsersTable";
import TripsTable from "./components/TripsTable";
import TicketsTable from "./components/TicketsTable";
import HypothesisTable from "./components/HypothesisTable";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

/* ─── Types ─────────────────────────────────────────────────────────── */
type AdminStats = {
  total_users: number;
  total_trips: number;
  draft_trips: number;
  confirmed_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  tickets_excedidos: number;
  tickets_advertencia: number;
  total_wishlist: number;
  total_tags_asignados: number;
  hipotesis_validadas: number;
  hipotesis_total: number;
  promedio_horas_planificacion: number;
};

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

type AdminHypothesis = {
  trip_id: string;
  trip_name: string;
  status: string;
  horas_planificacion: number;
  total_items_planificados: number;
  resultado_hipotesis: string;
  user_email: string;
};

type Slice = { label: string; value: number; color: string };

/* ─── SVG helpers ────────────────────────────────────────────────────── */
function trendLine(end: number, n = 9): number[] {
  const s = end * 0.55;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return s + (end - s) * t + Math.sin(i * 1.9) * end * 0.04;
  });
}

function sparkPaths(vals: number[], w: number, h: number) {
  if (vals.length < 2) return { line: "", area: "" };
  const min = Math.min(...vals), max = Math.max(...vals);
  const rng = (max - min) || 1;
  const step = w / (vals.length - 1);
  const pts = vals.map((v, i) => ({
    x: parseFloat((i * step).toFixed(1)),
    y: parseFloat((h - ((v - min) / rng) * h * 0.75 - h * 0.12).toFixed(1)),
  }));
  let line = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cp = parseFloat(((p.x + c.x) / 2).toFixed(1));
    line += ` C${cp},${p.y} ${cp},${c.y} ${c.x},${c.y}`;
  }
  return { line, area: `${line} L${pts[pts.length - 1].x},${h} L0,${h} Z` };
}

function donutSlices(data: Slice[], cx: number, cy: number, R: number, r: number) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  let angle = 0;
  return data.map((d) => {
    const pct = d.value / total;
    const start = angle + 0.5;
    const end = angle + pct * 360 - 0.5;
    angle += pct * 360;
    const lg = end - start > 180 ? 1 : 0;
    const s = toRad(start), e = toRad(end);
    const fix = (n: number) => parseFloat(n.toFixed(2));
    return {
      d: `M${fix(cx + R * Math.cos(s))},${fix(cy + R * Math.sin(s))} A${R},${R} 0 ${lg},1 ${fix(cx + R * Math.cos(e))},${fix(cy + R * Math.sin(e))} L${fix(cx + r * Math.cos(e))},${fix(cy + r * Math.sin(e))} A${r},${r} 0 ${lg},0 ${fix(cx + r * Math.cos(s))},${fix(cy + r * Math.sin(s))}Z`,
      pct: Math.round(pct * 100),
    };
  });
}

/* ─── Badges ─────────────────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:        { label: "Borrador",    cls: "bg-blue-50 text-blue-600 border-blue-100" },
  CONFIRMED:    { label: "Confirmado",  cls: "bg-green-50 text-green-600 border-green-100" },
  COMPLETED:    { label: "Completado",  cls: "bg-purple-50 text-purple-600 border-purple-100" },
  CANCELLED:    { label: "Cancelado",   cls: "bg-gray-100 text-gray-500 border-gray-200" },
  VALIDADA:     { label: "Validada",    cls: "bg-green-50 text-green-600 border-green-100" },
  NO_VALIDADA:  { label: "No validada", cls: "bg-red-50 text-red-500 border-red-100" },
  PENDIENTE:    { label: "Pendiente",   cls: "bg-amber-50 text-amber-600 border-amber-100" },
};

type Tab = "resumen" | "usuarios" | "viajes" | "presupuestos" | "hipotesis";
const TABS: { k: Tab; label: string }[] = [
  { k: "resumen",      label: "Resumen" },
  { k: "usuarios",     label: "Usuarios" },
  { k: "viajes",       label: "Viajes" },
  { k: "presupuestos", label: "Presupuestos" },
  { k: "hipotesis",    label: "Hipótesis" },
];

/* ═══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */
export default function AdminPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { profile } = useUserProfile();
  const [tab, setTab] = useState<Tab>("resumen");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTrips, setRecentTrips] = useState<AdminTrip[]>([]);
  const [hypoPreview, setHypoPreview] = useState<AdminHypothesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadResumen(); }, []);

  async function loadResumen() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const h = { Authorization: `Bearer ${token}` };
      const [sRes, tRes, hRes] = await Promise.all([
        fetch(`${BACKEND}/api/v1/admin/stats`, { headers: h }),
        fetch(`${BACKEND}/api/v1/admin/trips?page=1&limit=4`, { headers: h }),
        fetch(`${BACKEND}/api/v1/admin/hypothesis`, { headers: h }),
      ]);
      if (!sRes.ok) {
        if (sRes.status === 403) {
          router.replace("/dashboard");
          return;
        }
        throw new Error(`Error ${sRes.status}`);
      }
      const sd = await sRes.json();
      setStats(sd?.data ?? sd);
      if (tRes.ok) {
        const td = await tRes.json();
        setRecentTrips((td?.data?.trips ?? td?.trips ?? td?.data ?? []).slice(0, 4));
      }
      if (hRes.ok) {
        const hd = await hRes.json();
        setHypoPreview((hd?.data ?? hd ?? []).slice(0, 5));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#eef2ee]">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm transition-colors"
            >
              <IoArrowBack className="text-base" />
              Regresar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Panel de administración</h1>
              <p className="text-sm text-gray-500 mt-0.5">Datos en tiempo real de BonVoyage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100 text-sm text-gray-600">
              <IoCalendarOutline className="text-gray-400" />
              {today}
            </div>
            <div className="relative inline-flex items-center justify-center">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: profile?.avatar_url ? "opacity-0" : undefined,
                    userPreviewAvatarBox: profile?.avatar_url
                      ? { backgroundImage: `url('${profile.avatar_url}')`, backgroundSize: "cover", backgroundPosition: "center", borderRadius: "50%" }
                      : undefined,
                    userPreviewAvatarImage: profile?.avatar_url ? "opacity-0" : undefined,
                  },
                }}
              >
                <UserButton.UserProfilePage
                  label="Mi Avatar"
                  url="avatar"
                  labelIcon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  <AvatarProfilePage />
                </UserButton.UserProfilePage>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Mis viajes"
                    labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>}
                    href="/my-trips"
                  />
                  <UserButton.Link
                    label="Dashboard"
                    labelIcon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" /><path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" /></svg>}
                    href="/dashboard"
                  />
                </UserButton.MenuItems>
              </UserButton>
              {profile?.avatar_url && (
                <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden flex items-center justify-center">
                  <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-8 w-fit">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.k
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-6">
            <IoAlertCircleOutline className="text-4xl text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Resumen */}
        {tab === "resumen" && !error && (
          loading
            ? <ResumenSkeleton />
            : stats && (
                <ResumenTab
                  stats={stats}
                  recentTrips={recentTrips}
                  hypoPreview={hypoPreview}
                  onViewTrips={() => setTab("viajes")}
                  onViewHypothesis={() => setTab("hipotesis")}
                />
              )
        )}

        {tab === "usuarios"     && <UsersTable />}
        {tab === "viajes"       && <TripsTable />}
        {tab === "presupuestos" && <TicketsTable />}
        {tab === "hipotesis"    && <HypothesisTable />}
      </div>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────────────── */
function ResumenSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-36" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl h-72" />
        <div className="bg-white rounded-2xl h-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl h-52" />)}
      </div>
    </div>
  );
}

/* ─── Resumen tab ───────────────────────────────────────────────────── */
function ResumenTab({
  stats, recentTrips, hypoPreview, onViewTrips, onViewHypothesis,
}: {
  stats: AdminStats;
  recentTrips: AdminTrip[];
  hypoPreview: AdminHypothesis[];
  onViewTrips: () => void;
  onViewHypothesis: () => void;
}) {
  const donutData: Slice[] = [
    { label: "Borrador",   value: stats.draft_trips,     color: "#3b82f6" },
    { label: "Confirmado", value: stats.confirmed_trips,  color: "#22c55e" },
    { label: "Completado", value: stats.completed_trips,  color: "#a855f7" },
    { label: "Cancelado",  value: stats.cancelled_trips,  color: "#d1d5db" },
  ];

  const withinBudget = Math.max(
    0,
    stats.total_trips - stats.tickets_excedidos - stats.tickets_advertencia,
  );
  const budgetBars = [
    { label: "Dentro del presupuesto", value: withinBudget,                   color: "#22c55e" },
    { label: "Advertencia",            value: stats.tickets_advertencia,       color: "#f59e0b" },
    { label: "Excedido",               value: stats.tickets_excedidos,         color: "#ef4444" },
  ];
  const budgetMax = Math.max(...budgetBars.map((d) => d.value), 1);

  return (
    <div className="space-y-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="u" title="Total usuarios" value={stats.total_users}
          icon={<IoPeopleOutline />} color="#3b82f6"
          sub={`${stats.total_wishlist} en wishlist`}
        />
        <StatCard
          id="t" title="Total viajes" value={stats.total_trips}
          icon={<IoAirplaneOutline />} color="#22c55e"
          sub={`${stats.confirmed_trips} confirmados`}
        />
        <StatCard
          id="h"
          title="Hipótesis validadas"
          value={stats.hipotesis_validadas}
          icon={<IoCheckmarkCircleOutline />} color="#a855f7"
          sub={`de ${stats.hipotesis_total} totales`}
          suffix={`/${stats.hipotesis_total}`}
        />
        <StatCard
          id="p"
          title="Prom. planificación"
          value={parseFloat(Number(stats.promedio_horas_planificacion ?? 0).toFixed(1))}
          icon={<IoTimeOutline />} color="#f59e0b"
          sub="horas por viaje"
          format="decimal"
        />
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Donut — estados de viajes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-800">Estado de viajes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Distribución por estado actual</p>
            </div>
            <span className="text-xs bg-gray-50 text-gray-500 border border-gray-100 px-3 py-1 rounded-full">
              {stats.total_trips} total
            </span>
          </div>
          <div className="flex items-center gap-6">
            <DonutChart data={donutData} size={156} total={stats.total_trips} />
            <div className="flex flex-col gap-3 flex-1">
              {donutData.map((d) => (
                <div key={d.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-sm text-gray-600">{d.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bars — presupuesto */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-800">Alertas de presupuesto</h3>
              <p className="text-xs text-gray-400 mt-0.5">Viajes con ticket de presupuesto</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {budgetBars.map((d) => (
              <div key={d.label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-bold text-gray-800 tabular-nums">{d.value}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(d.value / budgetMax) * 100}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.total_tags_asignados}</p>
              <p className="text-xs text-gray-400 mt-0.5">Tags asignados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.total_wishlist}</p>
              <p className="text-xs text-gray-400 mt-0.5">En wishlist</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Viajes recientes ── */}
      {recentTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-base">Viajes recientes</h2>
            <button onClick={onViewTrips} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTrips.map((trip) => <TripCard key={trip.trip_id} trip={trip} />)}
          </div>
        </div>
      )}

      {/* ── Hipótesis preview ── */}
      {hypoPreview.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800">Hipótesis — resultados recientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Validación de hipótesis de planificación</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-green-50 text-green-600 border border-green-100 px-3 py-1 rounded-full font-medium">
                {stats.hipotesis_validadas} validadas
              </span>
              <button onClick={onViewHypothesis} className="text-sm text-blue-500 hover:text-blue-700 font-medium">
                Ver todas →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  {["Viaje", "Usuario", "Horas planif.", "Items", "Resultado"].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hypoPreview.map((h) => {
                  const st = STATUS_MAP[h.resultado_hipotesis] ?? { label: h.resultado_hipotesis, cls: "bg-gray-50 text-gray-500 border-gray-200" };
                  return (
                    <tr key={h.trip_id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-800 max-w-[160px] truncate">{h.trip_name}</td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs max-w-[160px] truncate">{h.user_email}</td>
                      <td className="px-6 py-3.5 text-gray-700 tabular-nums">{h.horas_planificacion?.toFixed?.(1) ?? "—"}h</td>
                      <td className="px-6 py-3.5 text-gray-700 tabular-nums">{h.total_items_planificados}</td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────── */
function StatCard({
  id, title, value, icon, color, sub, suffix = "", format,
}: {
  id: string; title: string; value: number; icon: React.ReactNode;
  color: string; sub: string; suffix?: string; format?: "decimal";
}) {
  const data = trendLine(value || 1);
  const { area, line } = sparkPaths(data, 220, 44);
  const display = format === "decimal" ? value.toFixed(1) : value.toLocaleString("es-MX");

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</span>
        <span className="text-xl" style={{ color }}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-black text-gray-800 tabular-nums leading-none">{display}</span>
        {suffix && <span className="text-base font-semibold text-gray-400">{suffix}</span>}
      </div>
      <p className="text-xs text-gray-400 mb-2">{sub}</p>
      <svg viewBox="0 0 220 44" className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#g-${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─── DonutChart ────────────────────────────────────────────────────── */
function DonutChart({ data, size, total }: { data: Slice[]; size: number; total: number }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.42, r = size * 0.26;
  const slices = donutSlices(data, cx, cy, R, r);

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={data[i].color} />
      ))}
      <text
        x={cx} y={cy - 4} textAnchor="middle"
        fill="#1f2937"
        style={{ fontSize: size * 0.145, fontWeight: 800 }}
      >
        {total}
      </text>
      <text
        x={cx} y={cy + size * 0.1} textAnchor="middle"
        fill="#9ca3af"
        style={{ fontSize: size * 0.08 }}
      >
        viajes
      </text>
    </svg>
  );
}

/* ─── TripCard (SliderCard style) ───────────────────────────────────── */
function TripCard({ trip }: { trip: AdminTrip }) {
  const st = STATUS_MAP[trip.status] ?? { label: trip.status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
  const hours = trip.planning_time_seconds ? Math.round(trip.planning_time_seconds / 3600) : 0;

  return (
    <div className="relative h-52 overflow-hidden rounded-2xl shadow-md group cursor-default">
      {trip.destination_image
        ? <img src={trip.destination_image} alt={trip.destination_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        : <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700" />
      }
      {/* Gradient overlay — same as SliderCard */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Status badge */}
      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${st.cls}`}>
        {st.label}
      </span>

      {/* Text — SliderCard style */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="mb-1.5 h-[2px] w-3 rounded-full bg-white/60" />
        <p className="text-[10px] uppercase tracking-widest text-white/60 mb-0.5 truncate">
          {trip.destination_name}
        </p>
        <h3 className="text-base font-black uppercase leading-tight text-white truncate">
          {trip.trip_name}
        </h3>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/50">
          <span>{trip.total_items} items</span>
          {hours > 0 && <span>{hours}h planificación</span>}
        </div>
      </div>
    </div>
  );
}
