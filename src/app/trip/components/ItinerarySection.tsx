"use client";

import { IoCalendar, IoCompass, IoRestaurant, IoLocationSharp, IoStar, IoTrash } from "react-icons/io5";
import type { TripItinerary, ItineraryItem } from "../types";

type Props = {
  itinerary: TripItinerary;
  onRemove: (itemId: string, dayNumber: number) => void;
};

export default function ItinerarySection({ itinerary, onRemove }: Props) {
  const totalItems = itinerary.days.reduce((sum, d) => sum + d.items.length, 0);

  if (itinerary.days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-gray-400">
        <IoCalendar className="text-5xl text-gray-200" />
        <p className="text-sm text-center max-w-xs">
          Tu itinerario está vacío. Agrega puntos de interés o restaurantes desde las otras secciones usando el botón <span className="font-semibold text-blue-400">+</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 max-w-6xl mx-auto pt-6 pb-10 space-y-8">

      
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <IoCalendar className="text-blue-400" />
        <span>
          {itinerary.days.length} día{itinerary.days.length !== 1 ? "s" : ""} &middot;{" "}
          {totalItems} actividad{totalItems !== 1 ? "es" : ""}
        </span>
      </div>

      
      {itinerary.days.map((day) => (
        <div key={day.dayNumber}>
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {day.dayNumber}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-700">Día {day.dayNumber}</h2>
              {day.date && (
                <p className="text-xs text-gray-400">
                  {new Date(day.date + "T00:00:00").toLocaleDateString("es-MX", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </p>
              )}
            </div>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">
              {day.items.length} actividad{day.items.length !== 1 ? "es" : ""}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pl-11">
            {day.items.map((item) => (
              <ItineraryCard
                key={item.itemId ?? item.id}
                item={item}
                onRemove={() => onRemove(item.itemId ?? item.id, day.dayNumber)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItineraryCard({
  item,
  onRemove,
}: {
  item: ItineraryItem;
  onRemove: () => void;
}) {
  const Icon = item.type === "poi" ? IoCompass : IoRestaurant;

  return (
    <div className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
      {/* Remove button — visible on hover */}
      <button
        onClick={onRemove}
        title="Eliminar"
        className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
      >
        <IoTrash className="text-red-400 text-xs" />
      </button>

      {/* Image */}
      <div className="w-full h-24 bg-gray-100 overflow-hidden">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <Icon className="text-2xl text-gray-200" />
          </div>
        )}
      </div>

      <div className="p-2.5">
        {/* Type badge */}
        <span
          className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
            item.type === "poi"
              ? "bg-blue-50 text-blue-600"
              : "bg-orange-50 text-orange-500"
          }`}
        >
          {item.type === "poi" ? "Lugar" : "Restaurante"}
        </span>

       
        <h3 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2 mt-1">
          {item.name}
        </h3>

        
        {item.rating && (
          <div className="flex items-center gap-1 mt-1">
            <IoStar className="text-amber-400 text-[10px]" />
            <span className="text-[10px] text-gray-600">{item.rating.toFixed(1)}</span>
            {item.priceLevel && (
              <span className="text-[10px] text-gray-400 ml-1">{item.priceLevel}</span>
            )}
          </div>
        )}

       
        <div className="flex items-start gap-1 mt-1.5">
          <IoLocationSharp className="text-gray-400 text-[9px] flex-shrink-0 mt-0.5" />
          <p className="text-[9px] text-gray-400 line-clamp-1">{item.address}</p>
        </div>
      </div>
    </div>
  );
}
