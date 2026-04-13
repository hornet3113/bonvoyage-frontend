import Link from "next/link";
import ParallaxSection from "./ParallaxSection";
import { IoAirplaneOutline } from "react-icons/io5";

export default function CTASection() {
  return (
    <ParallaxSection
      variant="dark"
      className="bg-slate-900 px-6 py-28 md:px-16"
    >
      <div className="mx-auto max-w-3xl flex flex-col items-center gap-8 text-center text-white">

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
          <IoAirplaneOutline className="text-3xl" />
        </div>

        <h2 className="text-4xl font-medium leading-tight md:text-5xl lg:text-6xl">
          Tu próximo viaje empieza{" "}
          <span className="italic text-cyan-400">hoy</span>
        </h2>

        <p className="max-w-md text-base leading-relaxed text-slate-400">
          Crea tu primer itinerario gratis. Sin saltar entre apps, sin perder tiempo.
          Todo lo que necesitas en un solo lugar.
        </p>

        <Link href="/dashboard">
          <button className="rounded-full px-10 py-4 bg-cyan-500 text-white font-medium text-sm transition duration-300 ease-in-out hover:opacity-80">
            Crear mi primer viaje
          </button>
        </Link>

        <p className="text-xs text-slate-600 uppercase tracking-widest">
          Bon Voyage · Planifica. Confirma. Viaja.
        </p>

      </div>
    </ParallaxSection>
  );
}
