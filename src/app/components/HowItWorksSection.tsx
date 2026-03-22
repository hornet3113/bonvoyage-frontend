import ParallaxSection from "./ParallaxSection";
import { IoMapOutline, IoCalendarOutline, IoCheckmarkCircleOutline } from "react-icons/io5";

const steps = [
  {
    number: "01",
    icon: <IoMapOutline className="text-2xl" />,
    title: "Busca tu destino",
    description:
      "Explora el mapa interactivo, descubre ciudades y encuentra inspiración para tu próximo viaje.",
  },
  {
    number: "02",
    icon: <IoCalendarOutline className="text-2xl" />,
    title: "Arma tu itinerario",
    description:
      "Agrega vuelos, hotel, restaurantes y puntos de interés. Todo organizado día a día en un solo lugar.",
  },
  {
    number: "03",
    icon: <IoCheckmarkCircleOutline className="text-2xl" />,
    title: "Confirma y viaja",
    description:
      "Revisa tu plan completo, confirma tu viaje y viaja con todo listo desde una sola plataforma.",
  },
];

const stats = [
  { value: "50%",  label: "Menos tiempo planificando" },
  { value: "4",    label: "Servicios integrados"      },
  { value: "180+", label: "Países disponibles"        },
  { value: "1",    label: "Sola plataforma"           },
];

export default function HowItWorksSection() {
  return (
    <ParallaxSection
      variant="light"
      className="bg-white px-6 py-24 md:px-16 lg:px-24"
    >
      <div className="mx-auto max-w-6xl flex flex-col gap-20">

        {/* Header */}
        <div className="flex flex-col gap-4 max-w-xl">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-6 bg-cyan-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
              Cómo funciona
            </span>
          </div>
          <h2 className="text-4xl font-medium leading-tight text-slate-800 md:text-5xl">
            De la idea al itinerario{" "}
            <span className="italic text-cyan-600">en minutos</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white flex-shrink-0">
                  {step.icon}
                </div>
                <span className="text-5xl font-bold text-slate-100 leading-none">
                  {step.number}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className="hidden md:block h-[1px] w-full bg-slate-100 mt-1 mb-1" />
              )}

              <h3 className="text-xl font-semibold text-slate-800">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 py-6 text-center"
            >
              <span className="text-3xl font-bold text-slate-900 md:text-4xl">{value}</span>
              <span className="mt-1 text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </ParallaxSection>
  );
}
