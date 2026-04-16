"use client";

import { useRef, useEffect } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/mapbox";
// @ts-ignore — CSS side-effect import, no type declarations needed
import "mapbox-gl/dist/mapbox-gl.css";
import { IoLocationSharp } from "react-icons/io5";

export type POI = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  places: POI[];
  selectedId: string | null;
  onSelectId: (id: string) => void;
  center: { lat: number; lng: number };
  /** Optional hex color per place id — defaults to #EF4444 */
  colorMap?: Record<string, string>;
};

export default function POIMap({ places, selectedId, onSelectId, center, colorMap }: Props) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const poi = places.find((p) => p.id === selectedId);
    if (!poi) return;
    mapRef.current.flyTo({
      center: [poi.lng, poi.lat],
      zoom: 16,
      duration: 1500,
    });
  }, [selectedId, places]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom: 13,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
    >
      <NavigationControl position="top-right" />

      {places.map((poi) => {
        const isSelected = selectedId === poi.id;
        const color = colorMap?.[poi.id] ?? "#EF4444";
        return (
          <Marker
            key={poi.id}
            longitude={poi.lng}
            latitude={poi.lat}
            anchor="bottom"
            onClick={() => onSelectId(poi.id)}
          >
            <div
              title={poi.name}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? "scale-150 drop-shadow-lg" : "scale-100 hover:scale-125"
              }`}
            >
              <IoLocationSharp
                className="text-3xl"
                style={{ color: isSelected ? "#2563EB" : color }}
              />
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
