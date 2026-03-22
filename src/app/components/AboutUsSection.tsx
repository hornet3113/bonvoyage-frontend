import ParallaxSection from "./ParallaxSection";
import { IoEarthOutline, IoRocketOutline, IoHeartOutline } from "react-icons/io5";

const values = [
  {
    icon: <IoEarthOutline className="text-2xl" />,
    title: "Misión",
    description:
      "Simplificar la planificación de viajes para que cada persona pueda explorar el mundo sin estrés, con todo en un solo lugar.",
  },
  {
    icon: <IoRocketOutline className="text-2xl" />,
    title: "Visión",
    description:
      "Ser la plataforma de referencia para viajeros de habla hispana, conectando sueños con itinerarios reales y accesibles.",
  },
  {
    icon: <IoHeartOutline className="text-2xl" />,
    title: "Valores",
    description:
      "Pasión por los viajes, innovación tecnológica y compromiso con una experiencia humana, intuitiva y memorable.",
  },
];

const stats = [
  { value: "2024", label: "Año de fundación" },
  { value: "180+", label: "Países disponibles" },
  { value: "4",    label: "Servicios integrados" },
  { value: "100%", label: "Enfoque en el viajero" },
];

export default function AboutUsSection() {
  return (
    <ParallaxSection
      variant="dark"
      className="bg-slate-900 px-6 py-28 md:px-16 lg:px-24"
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-20">

        {/* Header */}
        <div className="flex flex-col gap-5 max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-6 bg-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Sobre nosotros
            </span>
          </div>
          <h2 className="text-4xl font-medium leading-tight text-white md:text-5xl">
            Viajeros que crearon la herramienta que{" "}
            <span className="italic text-cyan-400">siempre quisieron</span>
          </h2>
          <p className="text-base leading-relaxed text-slate-300 max-w-xl">
            Bon Voyage nació de la frustración de planificar viajes con decenas de pestañas
            abiertas. Somos un equipo apasionado por el turismo y la tecnología, comprometidos
            a hacer que cada viaje sea inolvidable desde su primera planificación.
          </p>
        </div>

        {/* Values grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                {v.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{v.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{v.description}</p>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center"
            >
              <span className="text-3xl font-bold text-cyan-400 md:text-4xl">{value}</span>
              <span className="mt-1 text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </ParallaxSection>
  );
}
