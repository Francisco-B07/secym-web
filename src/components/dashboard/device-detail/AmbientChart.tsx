"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { ChartSeries } from "@/lib/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

// Creamos un esqueleto de carga genérico que podemos reutilizar
function ChartSkeleton() {
  return (
    <div className="h-96 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Cargando datos del gráfico...</p>
    </div>
  );
}

interface AmbientChartProps {
  seriesData: ChartSeries[];
  isLoading?: boolean;
}

export default function AmbientChart({
  seriesData,
  isLoading = false,
}: AmbientChartProps) {
  const options: ApexOptions = {
    chart: { height: 350, type: "line", animations: { enabled: false } },
    stroke: { width: [3, 3], curve: "smooth" },
    xaxis: { type: "datetime" },
    yaxis: [
      {
        seriesName: "Temperatura",
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#008FFB" },
        labels: {
          style: { colors: "#008FFB" },
          formatter: (val) => `${val?.toFixed(1)} °C`,
        },
        title: {
          text: "Temperatura Ambiente (°C)",
          style: { color: "#008FFB" },
        },
      },
      {
        seriesName: "Humedad",
        opposite: true,
        axisTicks: { show: true },
        axisBorder: { show: true, color: "#00E396" },
        labels: {
          style: { colors: "#00E396" },
          formatter: (val) => `${val?.toFixed(0)} %`,
        },
        title: { text: "Humedad Ambiente (%)", style: { color: "#00E396" } },
      },
    ],
    tooltip: { shared: true, x: { format: "dd MMM yyyy, HH:mm" } },
    legend: { position: "top" },
    noData: { text: "No hay datos de temperatura/humedad ambiente." },
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="w-full h-96">
      <Chart options={options} series={seriesData} type="line" height={350} />
    </div>
  );
}
