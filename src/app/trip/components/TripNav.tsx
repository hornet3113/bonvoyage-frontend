"use client";

import { TripSection } from "../page";
import { IoAirplane, IoBed, IoCompass, IoRestaurant, IoCalendar } from "react-icons/io5";

type Tab = {
  id: TripSection;
  label: string;
  icon: React.ReactNode;
};

const tabs: Tab[] = [
  { id: "vuelos",       label: "Vuelos",           icon: <IoAirplane className="text-xl" /> },
  { id: "hospedaje",    label: "Hospedajes",        icon: <IoBed className="text-xl" /> },
  { id: "puntos",       label: "Puntos de interés", icon: <IoCompass className="text-xl" /> },
  { id: "restaurantes", label: "Restaurantes",      icon: <IoRestaurant className="text-xl" /> },
  { id: "itinerario",   label: "Itinerario",        icon: <IoCalendar className="text-xl" /> },
];

type Props = {
  active: TripSection;
  onChange: (section: TripSection) => void;
};

export default function TripNav({ active, onChange }: Props) {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2
                transition-all duration-200 whitespace-nowrap
                ${active === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-300"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
