"use client";

import { useState, useRef, useEffect } from "react";
import { IoTimeOutline, IoClose } from "react-icons/io5";

// Slots every 30 min from 06:00 to 23:00
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function toDisplay(value: string): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
};

export default function TimePicker({ value, onChange, label, placeholder = "--:--" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="text-[10px] font-medium text-gray-500 block mb-1">{label}</label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-1.5 border rounded-lg px-2 py-1.5 text-xs transition-all bg-white ${
          open
            ? "border-blue-400 ring-2 ring-blue-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <IoTimeOutline className={`text-sm flex-shrink-0 ${open ? "text-blue-400" : "text-gray-400"}`} />
        <span className={`flex-1 text-left ${value ? "text-gray-700 font-medium" : "text-gray-400"}`}>
          {value ? toDisplay(value) : placeholder}
        </span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-gray-300 hover:text-red-400 transition-colors cursor-pointer"
          >
            <IoClose className="text-sm" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-2.5 w-52">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2 px-0.5">
            Selecciona la hora
          </p>
          <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto pr-0.5">
            {TIME_SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className={`text-[10px] font-semibold rounded-lg py-1.5 transition-all ${
                  value === t
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 bg-gray-50"
                }`}
              >
                {toDisplay(t)}
              </button>
            ))}
          </div>
          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="mt-2 w-full text-[10px] text-gray-400 hover:text-red-400 transition-colors py-1 border-t border-gray-100"
            >
              Limpiar hora
            </button>
          )}
        </div>
      )}
    </div>
  );
}
