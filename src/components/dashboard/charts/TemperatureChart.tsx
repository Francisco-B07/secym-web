"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { type ChartSeries } from "@/lib/types";

// Cargamos ApexCharts de forma dinámica
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TemperatureChartProps {
  seriesData: ChartSeries[];
  minThreshold: number;
  maxThreshold: number;
  isLoading?: boolean;
  type?: "line" | "scatter";
}

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
  type = "line",
}: TemperatureChartProps) {
  // 1. PROCESAMIENTO DE DATOS PARA RESALTAR ANOMALÍAS
  // `useMemo` optimiza el rendimiento, recalculando solo si los datos cambian.
  const processedSeries = useMemo(() => {
    const finalSeries: (ChartSeries & { type?: string })[] = [];
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
          normalPoints.push({ x: point.x, y: null }); // Crea un hueco en la línea normal
        } else {
          normalPoints.push(point);
        }
      });
      finalSeries.push({
        ...series,
        data: normalPoints,
      });
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
    const basePalette = [
      "#008FFB",
      "#00E396",
      "#FEB019",
      "#775DD0",
      "#A300D6",
      "#f2c037",
      "#d63384",
      "#6f42c1",
      "#fd7e14",
    ];
    let colorIndex = 0;
    return processedSeries.map((series) => {
      if (series.name.includes("(Anomalía)")) {
        return "#FF4560"; // Rojo para todas las anomalías
      }
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
    colors: chartColors,
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: processedSeries.map((s) =>
        s.name.includes("(Anomalía)") ? 0 : type === "line" ? 3 : 0
      ),
    },
    markers: {
      // Los puntos son visibles en scatter, o grandes para las anomalías
      size: processedSeries.map((s) =>
        s.name.includes("(Anomalía)") ? 6 : type === "scatter" ? 5 : 0
      ),
      strokeWidth: 0,
      hover: { size: 7 },
    },
    annotations: {
      yaxis: [
        {
          y: minThreshold,
          y2: maxThreshold,
          borderColor: "#00E396",
          fillColor: "#00E396",
          opacity: 0.1,
          label: {
            borderColor: "#000000",
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
      labels: { datetimeUTC: false, format: "dd MMM HH:mm" },
      title: { text: "Hora" },
    },
    yaxis: {
      labels: { formatter: (val) => `${val?.toFixed(1)} °C` },
      title: { text: "Temperatura (°C)" },
      tooltip: { enabled: true },
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: { format: "dd MMM yyyy, HH:mm" },
    },
    legend: {
      formatter: (seriesName) =>
        seriesName.includes("(Anomalía)") ? "" : seriesName,
      position: "top",
    },
    noData: {
      text: "No hay datos de temperatura para el rango seleccionado.",
      style: { fontSize: "16px", color: "#666" },
    },
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Usamos un `key` en el componente Chart para forzar su re-renderizado
  // cuando el tipo de gráfico cambia, asegurando que los estilos se apliquen correctamente.
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
