"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { format } from "date-fns";

interface ChartData {
  timestamp: string;
  probe_1: number | null;
}

interface TemperatureChartProps {
  data: ChartData[];
  minThreshold: number;
  maxThreshold: number;
}

export default function TemperatureChart({
  data,
  minThreshold,
  maxThreshold,
}: TemperatureChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    // Formateamos la fecha para que se vea bien en el eje X
    time: format(new Date(d.timestamp), "HH:mm"),
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip />
          <Legend />

          {/* LA MAGIA: ZONA SEGURA CON BANDAS DE UMBRAL */}
          <ReferenceArea
            y1={minThreshold}
            y2={maxThreshold}
            strokeOpacity={0.3}
            fill="green"
            fillOpacity={0.1}
            label={{ value: "Zona Segura", position: "insideTopLeft" }}
          />

          <Line
            type="monotone"
            dataKey="probe_1"
            name="Temperatura Sonda 1 (°C)"
            stroke="#8884d8"
            dot={(props) => {
              const { cx, cy, payload } = props;
              // Si el punto está fuera de la zona segura, lo pintamos de rojo
              if (
                payload.probe_1 < minThreshold ||
                payload.probe_1 > maxThreshold
              ) {
                return <circle cx={cx} cy={cy} r={5} fill="red" />;
              }
              return <circle cx={cx} cy={cy} r={3} fill="#8884d8" />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
