"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { createApiClient } from "@/lib/api";

const MIN_SECONDS = 2; // no enviar si estuvo menos de 2 segundos

/**
 * Mide el tiempo activo que el usuario pasa planificando un viaje.
 * Solo cuenta cuando la pestaña está visible y el viaje está en estado DRAFT.
 * Se pausa automáticamente si el usuario cambia de pestaña o minimiza el navegador.
 */
export function useTripTimeTracker(tripId: string | null, active: boolean) {
  const { getToken } = useAuth();
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!tripId || !active) return;

    function startTracking() {
      startRef.current = Date.now();
    }

    function stopAndSave() {
      if (startRef.current === null) return;
      const seconds = Math.floor((Date.now() - startRef.current) / 1000);
      startRef.current = null;
      if (seconds < MIN_SECONDS) return;

      // keepalive asegura que la request se complete aunque el usuario cierre la pestaña
      const api = createApiClient(getToken);
      api.patch(`/api/v1/trips/${tripId}/time`, { seconds }, { keepalive: true }).catch(() => {});
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        stopAndSave();
      } else {
        startTracking();
      }
    }

    startTracking();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", stopAndSave);

    return () => {
      stopAndSave(); // guardar al salir del componente (cambio de sección, etc.)
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", stopAndSave);
    };
  }, [tripId, active, getToken]);
}
