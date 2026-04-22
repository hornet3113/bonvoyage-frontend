"use client";

import { IoClose, IoWallet } from "react-icons/io5";

interface EditTripModalProps {
  editName: string;
  editStart: string;
  editEnd: string;
  editBudget: string;
  editCurrency: string;
  savingEdit: boolean;
  onClose: () => void;
  onSave: () => void;
  setEditName: (v: string) => void;
  setEditStart: (v: string) => void;
  setEditEnd: (v: string) => void;
  setEditBudget: (v: string) => void;
  setEditCurrency: (v: string) => void;
}

export default function EditTripModal({
  editName, editStart, editEnd, editBudget, editCurrency, savingEdit,
  onClose, onSave, setEditName, setEditStart, setEditEnd, setEditBudget, setEditCurrency,
}: EditTripModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Editar viaje</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <IoClose className="text-gray-400 text-lg" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Nombre del viaje
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ida</label>
              <input
                type="date"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Vuelta</label>
              <input
                type="date"
                value={editEnd}
                min={editStart}
                onChange={(e) => setEditEnd(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Presupuesto
              </label>
              <div className="relative mt-1">
                <IoWallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="number"
                  min={0}
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Moneda
              </label>
              <select
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300 bg-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="MXN">MXN</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={savingEdit || !editName.trim() || !editStart || !editEnd}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {savingEdit ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
