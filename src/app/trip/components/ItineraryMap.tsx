"use client";

import { useRef, useEffect } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { IoLocationSharp } from "react-icons/io5";

export type ItineraryMapItem = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "poi" | "restaurant" | "hotel";
  photoUrl?: string | null;
  rating?: number | null;
  address?: string;
  description?: string | null;
  dayNumber?: number;
};

type Props = {
  items: ItineraryMapItem[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  center: { lat: number; lng: number };
};

const TYPE_COLORS: Record<ItineraryMapItem["type"], string> = {
  hotel: "text-indigo-500",
  restaurant: "text-orange-500",
  poi: "text-blue-500",
};

const TYPE_COLORS_SELECTED: Record<ItineraryMapItem["type"], string> = {
  hotel: "text-indigo-700",
  restaurant: "text-orange-600",
  poi: "text-blue-700",
};

const BADGE: Record<ItineraryMapItem["type"], { label: string; cls: string }> = {
  poi: { label: "Lugar", cls: "bg-blue-50 text-blue-600" },
  restaurant: { label: "Restaurante", cls: "bg-orange-50 text-orange-500" },
  hotel: { label: "Hotel", cls: "bg-purple-50 text-purple-600" },
};

export default function ItineraryMap({ items, selectedId, onSelectId, center }: Props) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const item = items.find((p) => p.id === selectedId);
    if (!item) return;
    mapRef.current.flyTo({ center: [item.lng, item.lat], zoom: 15, duration: 1000 });
  }, [selectedId, items]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 13 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      onClick={() => onSelectId(null)}
    >
      <NavigationControl position="top-right" />

      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const colorClass = isSelected ? TYPE_COLORS_SELECTED[item.type] : TYPE_COLORS[item.type];
        return (
          <Marker
            key={item.id}
            longitude={item.lng}
            latitude={item.lat}
            anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); onSelectId(item.id); }}
          >
            <div
              title={item.name}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? "scale-150 drop-shadow-lg" : "scale-100 hover:scale-125"
              }`}
            >
              <IoLocationSharp className={`text-3xl ${colorClass}`} />
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
