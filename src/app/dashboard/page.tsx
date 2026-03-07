"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@clerk/nextjs";
import Header from "@/app/components/Header";
import DestinationCard from "./components/DestinationCard";
import CreateTripWizard from "./components/CreateTripWizard";

const MapView = dynamic(() => import("./components/MapView"), { ssr: false });

const BACKEND = "https://bonvoyage-backend.vercel.app";

type SelectedPlace = {
  name: string;
  country: string;
  fullName: string;
  lng: number;
  lat: number;
  photoUrl: string | null;
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number } | null>(null);
  const [wizardPlace, setWizardPlace] = useState<SelectedPlace | null>(null);
  const [wishlistToast, setWishlistToast] = useState<"success" | "error" | null>(null);
  const [fromWishlist, setFromWishlist] = useState(false);

  // Auto-open DestinationCard when navigating from wishlist "Planificar viaje"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fromWishlist") !== "1") return;
    const lat = parseFloat(params.get("lat") ?? "");
    const lng = parseFloat(params.get("lng") ?? "");
    const city = params.get("city") ?? "";
    const country = params.get("country") ?? "";
    const photo = params.get("photo") ?? null;
    if (!isNaN(lat) && !isNaN(lng) && city) {
      setFlyTo({ lat, lng });
      setSelectedPlace({ name: city, country, fullName: country ? `${city}, ${country}` : city, lat, lng, photoUrl: photo || null });
      setFromWishlist(true);
    }
  }, []);

  const handleSearch = useCallback(async (result: { name: string; lng: number; lat: number }) => {
    setFlyTo({ lng: result.lng, lat: result.lat });
    const res = await fetch(`/api/places?lat=${result.lat}&lng=${result.lng}`);
    const data = await res.json();
    setSelectedPlace({ name: data.name ?? result.name, country: data.country ?? "", fullName: data.fullName ?? data.name ?? result.name, lng: result.lng, lat: result.lat, photoUrl: data.photoUrl });
  }, []);

  async function handleSaveToWishlist(place: SelectedPlace) {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ city: place.name, country: place.country }),
      });
      if (!res.ok) throw new Error();
      setWishlistToast("success");
    } catch {
      setWishlistToast("error");
    } finally {
      setSelectedPlace(null);
      setTimeout(() => setWishlistToast(null), 3000);
    }
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header variant="light" onSearch={handleSearch} />
      <div className="relative flex-1">
        <MapView onPlaceSelect={setSelectedPlace} flyTo={flyTo} />
        {selectedPlace && !wizardPlace && (
          <DestinationCard
            place={selectedPlace}
            onSave={handleSaveToWishlist}
            onCancel={() => { setSelectedPlace(null); setFromWishlist(false); }}
            onCreateTrip={() => { setWizardPlace(selectedPlace); setSelectedPlace(null); }}
            hideSave={fromWishlist}
          />
        )}
        {wishlistToast && (
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all ${wishlistToast === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {wishlistToast === "success" ? "✓ Guardado en tu wishlist" : "No se pudo guardar en wishlist"}
          </div>
        )}
      </div>
      {wizardPlace && (
        <CreateTripWizard
          place={wizardPlace}
          onClose={() => setWizardPlace(null)}
        />
      )}
    </div>
  );
}
