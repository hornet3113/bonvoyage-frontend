"use client";

import {
  IoCheckmarkCircle, IoCloseCircle, IoTrophy,
  IoEllipsisHorizontalCircle, IoTrashOutline, IoPencilOutline,
} from "react-icons/io5";
import type { TripStatus } from "@/types/types";

interface TripStatusBarProps {
  tripStatus: TripStatus;
  changingStatus: boolean;
  confirmingDelete: boolean;
  deletingTrip: boolean;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onChangeStatus: (action: "confirm" | "cancel" | "complete") => void;
}

export default function TripStatusBar({
  tripStatus, changingStatus, confirmingDelete, deletingTrip,
  onEdit, onRequestDelete, onCancelDelete, onConfirmDelete, onChangeStatus,
}: TripStatusBarProps) {
  return (
    <div className="max-w-6xl mx-auto w-full px-4 pt-4">
      <div className="flex items-center gap-3 bg-white border border-cyan-100 rounded-2xl px-5 py-3 shadow-sm">
        {/* Status badge */}
        <div className="flex items-center gap-2 flex-1">
          {tripStatus === "DRAFT" && (
            <><IoEllipsisHorizontalCircle className="text-cyan-400 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-600">Borrador</span></>
          )}
          {tripStatus === "CONFIRMED" && (
            <><IoCheckmarkCircle className="text-cyan-500 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-700">Confirmado</span></>
          )}
          {tripStatus === "COMPLETED" && (
            <><IoTrophy className="text-cyan-600 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-cyan-800">Completado</span></>
          )}
          {tripStatus === "CANCELLED" && (
            <><IoCloseCircle className="text-red-400 text-xl flex-shrink-0" /><span className="text-sm font-semibold text-red-500">Cancelado</span></>
          )}
        </div>

        {/* Edit — solo en DRAFT */}
        {tripStatus === "DRAFT" && !confirmingDelete && (
          <button
            onClick={onEdit}
            title="Editar viaje"
            className="p-2 rounded-full hover:bg-cyan-50 transition-colors flex-shrink-0"
          >
            <IoPencilOutline className="text-gray-300 hover:text-cyan-400 text-lg transition-colors" />
          </button>
        )}

        {/* Delete */}
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs text-gray-500">¿Eliminar?</span>
            <button
              onClick={onConfirmDelete}
              disabled={deletingTrip}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Sí, eliminar
            </button>
            <button
              onClick={onCancelDelete}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={onRequestDelete}
            title="Eliminar viaje"
            className="p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <IoTrashOutline className="text-gray-300 hover:text-red-400 text-lg transition-colors" />
          </button>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {tripStatus === "DRAFT" && (
            <>
              <button
                onClick={() => onChangeStatus("confirm")}
                disabled={changingStatus}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <IoCheckmarkCircle className="text-sm" />
                Confirmar
              </button>
              <button
                onClick={() => onChangeStatus("cancel")}
                disabled={changingStatus}
                className="px-4 py-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-400 border border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <IoCloseCircle className="text-sm" />
                Cancelar
              </button>
            </>
          )}
          {tripStatus === "CONFIRMED" && (
            <>
              <button
                onClick={() => onChangeStatus("complete")}
                disabled={changingStatus}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                Marcar completado
              </button>
              <button
                onClick={() => onChangeStatus("cancel")}
                disabled={changingStatus}
                className="px-4 py-1.5 bg-white hover:bg-red-50 disabled:opacity-50 text-red-400 border border-red-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <IoCloseCircle className="text-sm" />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
