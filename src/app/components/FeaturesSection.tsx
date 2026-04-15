"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { MdFlight, MdRestaurant, MdLocalHospital } from "react-icons/md";
import { IoMapOutline } from "react-icons/io5";

const features = [
  {
    icon: <MdFlight className="text-xl" />,
    title: "Búsqueda de Vuelos",
    description:
      "Compara vuelos en tiempo real desde múltiples aerolíneas y encuentra la mejor opción para tu itinerario y presupuesto.",
  },
  {
    icon: <MdRestaurant className="text-xl" />,
    title: "Gastronomía Local",
    description:
      "Descubre restaurantes y experiencias culinarias cercanas a tus puntos de interés, filtradas por tipo de cocina y precio.",
  },
  {
    icon: <IoMapOutline className="text-xl" />,
    title: "Puntos de Interés",
    description:
      "Explora museos, parques, monumentos y atracciones locales visualizadas en un mapa interactivo personalizable.",
  },
  {
    icon: <MdLocalHospital className="text-xl" />,
    title: "Servicios Esenciales",
    description:
      "Hospitales, farmacias, bancos y transporte público siempre a la mano durante tu viaje para cualquier imprevisto.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="caracteristicas" className="bg-white px-6 py-20 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl flex flex-col gap-14">

        {/* Top row: título + botón */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <motion.h2
            className="text-4xl font-black uppercase leading-[1.05] tracking-tight text-slate-900 md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            TODO LO QUE NECESITAS
            <br />
            <span className="text-slate-300">PARA TU VIAJE</span>
          </motion.h2>

          <motion.div
            className="shrink-0 self-start md:pt-3"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <Link href="/dashboard">
              <motion.button
                className="rounded-full bg-slate-900 px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white"
                whileHover={{ scale: 1.03, opacity: 0.88 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                EXPLORAR AHORA
              </motion.button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom row: imagen + features */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Imagen */}
          <motion.div
            className="relative h-96 overflow-hidden rounded-2xl md:h-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img
              src="/images/image3.jpg"
              alt="Destino de viaje"
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* Grid 2×2 de features */}
          <div className="col-span-2 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
                whileHover={{ y: -3 }}
              >
                <motion.div
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600"
                  whileHover={{ scale: 1.15, backgroundColor: "#cffafe" }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {f.icon}
                </motion.div>
                <h3 className="font-semibold text-slate-800">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
