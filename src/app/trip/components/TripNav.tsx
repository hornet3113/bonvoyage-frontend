"use client";

import { TripSection } from "../page";
import { IoAirplane, IoBed, IoCompass, IoRestaurant, IoCalendar } from "react-icons/io5";

type Tab = {
  id: TripSection;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
};

const tabs: Tab[] = [
  { id: "vuelos",       label: "Vuelos",           shortLabel: "Vuelos",  icon: <IoAirplane /> },
  { id: "hospedaje",    label: "Hospedajes",        shortLabel: "Hotel",   icon: <IoBed /> },
  { id: "puntos",       label: "Puntos de interés", shortLabel: "Lugares", icon: <IoCompass /> },
  { id: "restaurantes", label: "Restaurantes",      shortLabel: "Comida",  icon: <IoRestaurant /> },
  { id: "itinerario",   label: "Itinerario",        shortLabel: "Plan",    icon: <IoCalendar /> },
];

type Props = {
  active: TripSection;
  onChange: (section: TripSection) => void;
};

export default function TripNav({ active, onChange }: Props) {
  return (
    <>
      {/* ── Desktop: sticky top tab bar (unchanged) ── */}
      <div className="hidden md:block w-full bg-white border-b border-gray-200 sticky top-0 z-10">
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
                <span className="text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: fixed bottom navigation bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex-1 flex flex-col items-center justify-center gap-0.5
                py-2.5 px-1 text-[10px] font-medium
                transition-all duration-200
                ${active === tab.id
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
                }
              `}
            >
              <span className={`text-[20px] leading-none transition-transform duration-200 ${active === tab.id ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className="leading-none mt-0.5">{tab.shortLabel}</span>
              {active === tab.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
