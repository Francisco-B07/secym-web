interface ProbeTemperaturesProps {
  temperatures: number[] | null;
}

// Función para determinar el color de la sonda según la temperatura
const getTempColor = (temp: number) => {
  if (temp < 2 || temp > 8) return "bg-red-100 text-red-800"; // Umbrales de ejemplo para vacunas
  if (temp < 4 || temp > 6) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
};

export default function ProbeTemperatures({
  temperatures,
}: ProbeTemperaturesProps) {
  if (!temperatures || temperatures.length === 0) {
    return <p className="text-sm text-gray-500">Sin datos de sondas.</p>;
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-2">
        Temperaturas de Sondas (°C)
      </h4>
      <div className="flex flex-wrap gap-2">
        {temperatures.map((temp, index) => (
          <span
            key={index}
            className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${getTempColor(
              temp
            )}`}
          >
            {temp.toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
