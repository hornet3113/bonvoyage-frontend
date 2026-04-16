"use client";

import { useEffect, useRef, useState } from "react";
import Map, { Marker, Popup, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { IoAirplane } from "react-icons/io5";

type Trip = {
  trip_id: string;
  trip_name: string;
  destination_name?: string;
  destination_city?: string;
  destination_image?: string;
  status?: string;
};

type TripMarker = {
  trip_id: string;
  trip_name: string;
  destination: string;
  destination_image?: string;
  status?: string;
  lng: number;
  lat: number;
};

type Props = {
  trips: Trip[];
};

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "#22c55e",
  COMPLETED: "#6b7280",
  CANCELLED: "#ef4444",
  DRAFT: "#3b82f6",
  PLANNED: "#3b82f6",
};

async function geocode(query: string): Promise<{ lng: number; lat: number } | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&language=es&limit=1&types=place,region,country`
    );
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;
    const [lng, lat] = feature.center;
    return { lng, lat };
  } catch {
    return null;
  }
}

export default function TripsMapView({ trips }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [markers, setMarkers] = useState<TripMarker[]>([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const geocodedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pending = trips.filter((t) => {
      const key = t.destination_city ?? t.destination_name ?? "";
      return key && !geocodedRef.current.has(t.trip_id);
    });
    if (!pending.length) return;

    pending.forEach(async (trip) => {
      const query = trip.destination_city ?? trip.destination_name ?? "";
      if (!query) return;
      geocodedRef.current.add(trip.trip_id);
      const coords = await geocode(query);
      if (!coords) return;
      setMarkers((prev) => {
        // avoid duplicates
        if (prev.some((m) => m.trip_id === trip.trip_id)) return prev;
        return [
          ...prev,
          {
            trip_id: trip.trip_id,
            trip_name: trip.trip_name,
            destination: trip.destination_city ?? trip.destination_name ?? "",
            destination_image: trip.destination_image,
            status: trip.status,
            ...coords,
          },
        ];
      });
    });
  }, [trips]);

  // Fit map to show all markers when they update
  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;
    if (markers.length === 1) {
      mapRef.current.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 4, duration: 800 });
      return;
    }
    const lngs = markers.map((m) => m.lng);
    const lats = markers.map((m) => m.lat);
    const padding = 80;
    mapRef.current.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding, maxZoom: 6, duration: 800 }
    );
  }, [markers]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 0, latitude: 20, zoom: 1.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        minZoom={1}
        maxZoom={10}
        onClick={() => setActivePopup(null)}
      >
        {markers.map((marker) => {
          const color = STATUS_COLOR[marker.status ?? ""] ?? "#3b82f6";
          return (
            <Marker
              key={marker.trip_id}
              longitude={marker.lng}
              latitude={marker.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setActivePopup((prev) => (prev === marker.trip_id ? null : marker.trip_id));
              }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={marker.trip_name}
              >
                <IoAirplane className="text-white text-sm" />
              </div>
            </Marker>
          );
        })}

        {activePopup &&
          (() => {
            const m = markers.find((mk) => mk.trip_id === activePopup);
            if (!m) return null;
            return (
              <Popup
                longitude={m.lng}
                latitude={m.lat}
                anchor="bottom"
                offset={36}
                closeButton={false}
                onClose={() => setActivePopup(null)}
                className="trips-map-popup"
              >
                <div className="w-44 rounded-xl overflow-hidden shadow text-xs font-sans">
                  {m.destination_image && (
                    <img src={m.destination_image} alt={m.destination} className="w-full h-20 object-cover" />
                  )}
                  <div className="p-2 bg-white">
                    <p className="font-bold text-gray-800 truncate">{m.trip_name}</p>
                    <p className="text-gray-500 truncate">{m.destination}</p>
                  </div>
                </div>
              </Popup>
            );
          })()}
      </Map>
    </div>
  );
}
