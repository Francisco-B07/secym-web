"use client";

import { useState, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import { subHours, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, XMarkIcon } from "@heroicons/react/24/outline";

const presets = [
  { label: "Última hora", hours: 1 },
  { label: "Últimas 6 horas", hours: 6 },
  { label: "Últimas 24 horas", hours: 24 },
  { label: "Últimos 7 días", hours: 24 * 7 },
];

export default function TimeRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --- ESTADO LOCAL PARA EL CALENDARIO PERSONALIZADO ---
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  // Inicializamos el estado del calendario con los valores de la URL, si existen
  const [startDate, setStartDate] = useState<Date | null>(
    searchParams.get("from") ? parseISO(searchParams.get("from")!) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    searchParams.get("to") ? parseISO(searchParams.get("to")!) : null
  );

  // --- LÓGICA DE NAVEGACIÓN ---
  // Función centralizada para actualizar la URL con el nuevo rango de fechas
  const handleSetRange = useCallback(
    (from: Date, to: Date) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("from", from.toISOString());
      current.set("to", to.toISOString());

      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`);
    },
    [searchParams, router, pathname]
  );

  const handlePresetClick = (hours: number) => {
    const to = new Date();
    const from = subHours(to, hours);
    handleSetRange(from, to);
  };

  const handleCustomApply = () => {
    if (startDate && endDate) {
      handleSetRange(startDate, endDate);
      setIsPickerOpen(false);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-lg border">
      {/* Botones predefinidos */}
      {presets.map((preset) => (
        <button
          key={preset.hours}
          onClick={() => handlePresetClick(preset.hours)}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {preset.label}
        </button>
      ))}

      {/* Botón para rango personalizado */}
      <div className="relative">
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 flex items-center"
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Personalizado
        </button>

        {/* Pop-up del calendario */}
        {isPickerOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white border rounded-lg shadow-xl z-10 p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold">Selecciona un rango</h4>
              <button onClick={() => setIsPickerOpen(false)}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <DatePicker
              selected={startDate}
              onChange={(dates) => {
                const [start, end] = dates;
                setStartDate(start);
                setEndDate(end);
              }}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline // Muestra el calendario directamente
              locale={es} // Calendario en español
            />
            <button
              onClick={handleCustomApply}
              disabled={!startDate || !endDate}
              className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50"
            >
              Aplicar Rango
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
