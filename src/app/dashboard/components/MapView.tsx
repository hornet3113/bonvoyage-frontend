"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

type SelectedPlace = {
  name: string;
  country: string;
  fullName: string;
  lng: number;
  lat: number;
  photoUrl: string | null;
};

type Props = {
  onPlaceSelect: (place: SelectedPlace) => void;
  flyTo?: { lng: number; lat: number } | null;
};

export default function MapView({ onPlaceSelect, flyTo }: Props) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 12, duration: 2000 });
  }, [flyTo]);

  const handleClick = useCallback(
    async (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat;

      let name = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      let country = "";
      let fullName = name;
      let photoUrl: string | null = null;

      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=place,locality,neighborhood,region,country`
        );
        const geoData = await geoRes.json();
        const feature = geoData.features?.[0];
        if (feature) {
          name = feature.text ?? name;
          fullName = feature.place_name ?? name;
          const countryCtx = feature.context?.find((c: { id: string }) => c.id.startsWith("country."));
          country = countryCtx?.text ?? "";
        }
      } catch { /* usa coordenadas como fallback */ }

      try {
        const photoRes = await fetch(`/api/photo?q=${encodeURIComponent(name)}`);
        const photoData = await photoRes.json();
        photoUrl = photoData.photoUrl ?? null;
      } catch { /* sin foto */ }

      onPlaceSelect({ name, country, fullName, lng, lat, photoUrl });
    },
    [onPlaceSelect]
  );

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      onClick={handleClick}
      cursor="pointer"
    />
  );
}
