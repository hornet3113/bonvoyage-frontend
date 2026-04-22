"use client";
import { motion } from "motion/react";
import {
  IoEarthOutline,
  IoRocketOutline,
  IoShieldCheckmarkOutline,
  IoPeopleOutline,
} from "react-icons/io5";

const stats = [
  { value: "2024", label: "Año de fundación" },
  { value: "180+", label: "Países disponibles" },
  { value: "4",    label: "Servicios integrados" },
  { value: "100%", label: "Enfoque en el viajero" },
];

const values = [
  {
    icon: <IoEarthOutline className="text-xl" />,
    title: "Misión",
    description:
      "Simplificar la planificación de viajes para que cada persona pueda explorar el mundo sin estrés, con todo en un solo lugar.",
  },
  {
    icon: <IoShieldCheckmarkOutline className="text-xl" />,
    title: "Confianza",
    description:
      "Plataforma segura y transparente. Sin sorpresas, sin redireccionamientos. Todo lo que necesitas está aquí.",
  },
  {
    icon: <IoPeopleOutline className="text-xl" />,
    title: "Comunidad",
    description:
      "Creemos en viajeros que se ayudan. Comparte experiencias, rutas y recomendaciones con una comunidad real.",
  },
];

export default function AboutUsSection() {
  return (
    <section id="nosotros" className="bg-slate-50 px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto max-w-6xl flex flex-col gap-20">

        
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3">
            <motion.span
              className="h-[2px] bg-cyan-500"
              initial={{ width: 0 }}
              whileInView={{ width: 24 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
              Sobre nosotros
            </span>
          </div>

          <h2 className="text-4xl font-medium leading-[1.15] text-slate-800 md:text-5xl lg:text-6xl max-w-4xl">
            Nacimos de la frustración de{" "}
            <span className="italic text-cyan-600">planificar con 30 pestañas abiertas.</span>
          </h2>
        </motion.div>


        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-stretch">

      
          <motion.div
            className="relative overflow-hidden rounded-3xl min-h-[420px]"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/images/slide1.jpg"
              alt="Destino"
              className="absolute inset-0 h-full w-full object-cover"
            />
           
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

           
            <div className="absolute top-5 left-5 flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm border border-white/30">
              <IoRocketOutline className="text-white text-sm" />
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">Bon Voyage</span>
            </div>

         
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-3">
              <p className="text-white font-semibold text-lg leading-snug">
                Explora el mundo.<br />Planifica sin estrés.
              </p>
             
              <div className="flex flex-wrap gap-2">
                {["Vuelos", "Hoteles", "Restaurantes", "POI"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

       
          <motion.div
            className="flex flex-col justify-between gap-10"
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.2, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-5">
              <p className="text-base leading-relaxed text-slate-600 max-w-md">
                Bon Voyage es el resultado de viajeros que se cansaron de saltar entre apps.
                Somos un equipo apasionado por el turismo y la tecnología, comprometidos a
                centralizar toda la experiencia de viaje en una sola plataforma.
              </p>
              <p className="text-base leading-relaxed text-slate-500 max-w-md">
                Desde buscar vuelos hasta encontrar el mejor restaurante cerca de tu hotel,
                lo ponemos todo en tus manos, sin complicaciones.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  className="flex flex-col border-l-2 border-cyan-400 pl-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                >
                  <span className="text-3xl font-bold text-slate-900">{value}</span>
                  <span className="text-xs text-slate-500 mt-0.5">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Divider ── */}
        <motion.div
          className="h-[1px] bg-slate-200"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{ originX: 0 }}
        />

        {/* ── Values — 3 columns ── */}
        <div>
          <motion.p
            className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Por qué elegirnos
          </motion.p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  {v.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-800">{v.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
