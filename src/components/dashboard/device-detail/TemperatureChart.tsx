"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { type ChartSeries } from "@/lib/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TemperatureChartProps {
  seriesData: ChartSeries[];
  minThreshold: number;
  maxThreshold: number;
  isLoading?: boolean;
  type?: "line" | "scatter";
}

// Un componente de esqueleto de carga para el gráfico
function ChartSkeleton() {
  return (
    <div className="h-96 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Cargando datos del gráfico...</p>
    </div>
  );
}

export default function TemperatureChart({
  seriesData,
  minThreshold,
  maxThreshold,
  isLoading = false,
  type = "scatter",
}: TemperatureChartProps) {
  // 1. PROCESAMIENTO DE DATOS PARA RESALTAR ANOMALÍAS
  // Esta es la lógica clave. Creamos nuevas series que solo contienen los puntos
  // que están fuera de los umbrales para poder darles un estilo diferente.
  const processedSeries = useMemo(() => {
    const finalSeries: ChartSeries[] = [];

    if (!seriesData || seriesData.every((s) => s.data.length === 0)) {
      return [];
    }

    seriesData.forEach((series) => {
      const normalPoints: { x: number; y: number | null }[] = [];
      const anomalyPoints: { x: number; y: number | null }[] = [];

      series.data.forEach((point) => {
        if (
          point.y !== null &&
          (point.y < minThreshold || point.y > maxThreshold)
        ) {
          anomalyPoints.push(point);
          // ...añadimos un `null` a la serie normal para crear un hueco en la línea.
          normalPoints.push({ x: point.x, y: null });
        } else {
          normalPoints.push(point);
        }
      });

      // La serie normal ahora contiene los huecos
      finalSeries.push({
        ...series,
        data: normalPoints,
      });

      // La serie de anomalías solo contiene los puntos rojos
      if (anomalyPoints.length > 0) {
        finalSeries.push({
          name: `${series.name} (Anomalía)`,
          data: anomalyPoints,
        });
      }
    });
    return finalSeries;
  }, [seriesData, minThreshold, maxThreshold]);

  const chartColors = useMemo(() => {
    const basePalette = ["#008FFB", "#00E396", "#FEB019", "#775DD0", "#A300D6"];
    let colorIndex = 0;
    return processedSeries.map((series) => {
      if (series.name.includes("(Anomalía)")) return "#FF4560";
      const color = basePalette[colorIndex % basePalette.length];
      colorIndex++;
      return color;
    });
  }, [processedSeries]);

  // 2. CONFIGURACIÓN AVANZADA DE APEXCHARTS
  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      zoom: { enabled: true, type: "x", autoScaleYaxis: true },
      toolbar: { autoSelected: "zoom" },
      animations: { enabled: true, speed: 500 },
    },
    // Asignamos colores y estilos distintos a las series normales y a las de anomalías
    colors: chartColors,
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: processedSeries.map((s) =>
        s.name.includes("(Anomalía)") ? 0 : type === "line" ? 3 : 0
      ),
    },
    // Configuramos los puntos (markers)
    markers: {
      // Si es anomalía, tamaño 6. Si es normal y tipo 'scatter', tamaño 5. Si es normal y tipo 'line', tamaño 0.
      size: processedSeries.map((s) =>
        s.name.includes("(Anomalía)") ? 6 : type === "scatter" ? 5 : 0
      ),
      strokeWidth: 0,
      hover: { size: 7 },
    },
    // ANOTACIONES PARA LAS BANDAS DE UMBRAL (ZONA SEGURA)
    annotations: {
      yaxis: [
        {
          y: minThreshold,
          y2: maxThreshold,
          borderColor: "#000",
          fillColor: "#00E396",
          opacity: 0.1,
          label: {
            borderColor: "#00E396",
            style: { color: "#fff", background: "#00E396" },
            text: "Zona Segura",
            position: "left",
            offsetX: 10,
          },
        },
      ],
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false, // Muestra las horas en la zona horaria local del navegador
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `${val?.toFixed(1)}°C`,
      },
      tooltip: {
        enabled: true,
      },
    },
    // El tooltip compartido es clave para comparar valores en un punto en el tiempo
    tooltip: {
      shared: true,
      intersect: false, // Asegura que el tooltip aparezca aunque haya huecos (nulls)
      x: { format: "dd MMM yyyy, HH:mm" },
    },
    legend: {
      formatter: (seriesName) =>
        seriesName.includes("(Anomalía)") ? "" : seriesName,
      position: "top",
    },
    noData: { text: "No hay datos de temperatura para el rango seleccionado." },
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div id="temperature-chart" className="w-full">
      <Chart
        key={type}
        options={options}
        series={processedSeries}
        type="line"
        height={400}
      />
    </div>
  );
}
