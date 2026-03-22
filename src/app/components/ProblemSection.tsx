import { MdFlight, MdHotel, MdRestaurant } from "react-icons/md";
import { IoArrowDownOutline, IoCheckmarkCircle } from "react-icons/io5";

const problems = [
  {
    icon: <MdFlight className="text-lg" />,
    bold: "Buscas vuelos",
    rest: "en Kayak, Google Flights, Skyscanner...",
  },
  {
    icon: <MdHotel className="text-lg" />,
    bold: "Buscas hoteles",
    rest: "en Booking, Airbnb, Hotels.com...",
  },
  {
    icon: <MdRestaurant className="text-lg" />,
    bold: "Buscas restaurantes",
    rest: "en TripAdvisor, Google Maps, Yelp...",
  },
];

export default function ProblemSection() {
  return (
    <section className="bg-slate-50 px-6 py-24 md:px-16 lg:px-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 md:grid-cols-2">

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="h-[2px] w-6 bg-cyan-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-600">
              El Problema
            </span>
          </div>

          <h2 className="text-4xl font-medium leading-tight text-slate-800 md:text-5xl lg:text-6xl">
            Planificar un viaje{" "}
            <span className="italic text-cyan-600">no debería ser</span>{" "}
            tan complicado
          </h2>

          <p className="max-w-md text-base leading-relaxed text-slate-500">
            Los viajeros pasan horas saltando entre apps y sitios web para
            armar un solo itinerario. Bon Voyage lo centraliza todo.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {problems.map(({ icon, bold, rest }) => (
            <div
              key={bold}
              className="flex items-center gap-4 rounded-xl bg-slate-200/60 px-5 py-4 text-sm text-slate-500"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300/70 text-slate-400">
                {icon}
              </span>
              <p>
                <span className="font-semibold text-slate-600">{bold} </span>
                <span className="line-through">{rest}</span>
              </p>
            </div>
          ))}

          <div className="flex justify-center py-2">
            <IoArrowDownOutline className="text-2xl text-cyan-500" />
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500">
              <IoCheckmarkCircle className="text-xl text-white" />
            </span>
            <p className="text-slate-700">
              <span className="font-bold">Todo en Bon Voyage.</span>{" "}
              Un destino, un itinerario, una plataforma.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
