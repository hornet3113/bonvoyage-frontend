"use client";

import { Suspense } from "react";
import Header from "@/app/components/Header";
import TripNav from "./components/TripNav";
import FlightsSection from "./components/FlightsSection";
import HotelsSection from "./components/HotelsSection";
import PointsOfInterestSection from "./components/PointsOfInterestSection";
import RestaurantsSection from "./components/RestaurantsSection";
import ItinerarySection from "./components/ItinerarySection";
import TripStatusBar from "./components/TripStatusBar";
import EditTripModal from "./components/EditTripModal";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import type { TripSection } from "@/types/types";
import { useTripPage } from "@/hooks/useTripPage";

function TripPageContent() {
  const {
    tripId, activeSection, handleSectionChange,
    itinerary, savedHotel, setSavedHotel, savedFlight, setSavedFlight,
    loadingTrip, tripError, isFavorite, tripStatus, changingStatus,
    confirmingDelete, setConfirmingDelete, deletingTrip,
    editOpen, setEditOpen, editName, setEditName, editStart, setEditStart,
    editEnd, setEditEnd, editBudget, setEditBudget, editCurrency, setEditCurrency,
    savingEdit, tripMeta, destination, wizardFlightParams, tripDays,
    loadTrip, toggleFavorite, changeStatus, openEdit, saveEdit, handleDeleteTrip,
    addToItinerary, reorderItinerary, editItineraryItem, moveItineraryItem, removeFromItinerary,
  } = useTripPage();

  const sectionComponents: Record<TripSection, React.ReactNode> = {
    vuelos: (
      <FlightsSection
        destination={destination}
        tripId={tripId ?? undefined}
        tripDays={tripDays}
        defaultOrigin={wizardFlightParams.origin}
        defaultDepartDate={wizardFlightParams.startDate}
        defaultReturnDate={wizardFlightParams.endDate}
        defaultPassengers={wizardFlightParams.passengers}
        defaultCabinClass={wizardFlightParams.cabinClass}
        onFlightSave={(info) => { setSavedFlight(info); loadTrip(); }}
      />
    ),
    hospedaje: (
      <HotelsSection
        destination={destination}
        tripId={tripId ?? ""}
        tripDays={tripDays}
        savedHotelExternalId={savedHotel?.externalId ?? null}
        onHotelSave={(hotel) => { setSavedHotel(hotel); loadTrip(); }}
      />
    ),
    puntos: (
      <PointsOfInterestSection
        destination={destination}
        tripDays={tripDays}
        onAddToItinerary={addToItinerary}
        readOnly={tripStatus !== "DRAFT"}
      />
    ),
    restaurantes: (
      <RestaurantsSection
        destination={destination}
        tripDays={tripDays}
        onAddToItinerary={addToItinerary}
        readOnly={tripStatus !== "DRAFT"}
      />
    ),
    itinerario: (
      <ItinerarySection
        tripId={tripId ?? undefined}
        itinerary={itinerary}
        currency={tripMeta?.currency ?? "USD"}
        onRemove={removeFromItinerary}
        onReorder={reorderItinerary}
        onEdit={tripStatus === "DRAFT" ? editItineraryItem : undefined}
        onMove={tripStatus === "DRAFT" ? moveItineraryItem : undefined}
        savedHotel={savedHotel}
        savedFlight={savedFlight}
        readOnly={tripStatus !== "DRAFT"}
        center={
          destination.lat && destination.lng
            ? { lat: destination.lat, lng: destination.lng }
            : undefined
        }
      />
    ),
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header variant="light" />
      <TripNav active={activeSection} onChange={handleSectionChange} />

      {tripId && (
        <TripStatusBar
          tripStatus={tripStatus}
          changingStatus={changingStatus}
          confirmingDelete={confirmingDelete}
          deletingTrip={deletingTrip}
          onEdit={openEdit}
          onRequestDelete={() => setConfirmingDelete(true)}
          onCancelDelete={() => setConfirmingDelete(false)}
          onConfirmDelete={handleDeleteTrip}
          onChangeStatus={changeStatus}
        />
      )}

      {/* Destination hero */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-6">
        <div className="relative h-100 w-full overflow-hidden rounded-2xl bg-gray-800 shadow-md">
          {destination.photoUrl ? (
            <img
              src={destination.photoUrl}
              alt={destination.name}
              className="w-full h-full object-cover opacity-75"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-400" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {tripId && (
            <button
              onClick={toggleFavorite}
              title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              {isFavorite
                ? <IoHeart className="text-red-400 text-2xl" />
                : <IoHeartOutline className="text-white text-2xl" />
              }
            </button>
          )}

          <div className="absolute bottom-24 left-7">
            <div className="mb-2 h-[2px] w-6 rounded-full bg-white" />
            {destination.country && (
              <p className="mb-1 text-[11px] uppercase tracking-widest text-white/60">
                {destination.country}
              </p>
            )}
            <h1 className="text-5xl font-black uppercase leading-tight text-white drop-shadow-lg">
              {destination.name}
            </h1>
            {loadingTrip && <p className="text-white/60 text-sm mt-2">Cargando itinerario...</p>}
            {tripError && <p className="text-red-300 text-sm mt-2">{tripError}</p>}
          </div>
        </div>
      </div>

      <main className="flex-1 w-full pt-0 pb-24 md:pb-6">
        {sectionComponents[activeSection]}
      </main>

      {editOpen && (
        <EditTripModal
          editName={editName}
          editStart={editStart}
          editEnd={editEnd}
          editBudget={editBudget}
          editCurrency={editCurrency}
          savingEdit={savingEdit}
          onClose={() => setEditOpen(false)}
          onSave={saveEdit}
          setEditName={setEditName}
          setEditStart={setEditStart}
          setEditEnd={setEditEnd}
          setEditBudget={setEditBudget}
          setEditCurrency={setEditCurrency}
        />
      )}
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-gray-400">Cargando...</div>}>
      <TripPageContent />
    </Suspense>
  );
}
