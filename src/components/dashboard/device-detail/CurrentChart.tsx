"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { ChartProps } from "@/lib/types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function ChartSkeleton() {
  return (
    <div className="h-96 w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <p className="text-gray-500">Cargando datos del gráfico...</p>
    </div>
  );
}

// Usamos ChartProps que ahora incluye isLoading
export default function CurrentChart({
  seriesData,
  isLoading = false,
}: ChartProps) {
  const options: ApexOptions = {
    chart: { type: "bar", height: 350, stacked: true, toolbar: { show: true } },
    plotOptions: { bar: { horizontal: false, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false, format: "dd MMM HH:mm" },
    },
    yaxis: {
      title: { text: "Amperes (A)" },
      labels: { formatter: (val) => val.toFixed(1) },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: { formatter: (val) => `${val.toFixed(2)} A` },
      x: { format: "dd MMM yyyy - HH:mm" },
    },
    legend: { position: "top", horizontalAlign: "center" },
    noData: { text: "No hay datos de consumo de corriente." },
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="h-96 w-full">
      <Chart options={options} series={seriesData} type="bar" height={350} />
    </div>
  );
}
