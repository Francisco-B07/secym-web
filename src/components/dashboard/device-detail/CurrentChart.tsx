"use client";

import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { type ChartProps } from "@/lib/types";

export default function CurrentChart({ seriesData }: ChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      stacked: true, // Apilamos las barras para ver el consumo total
      toolbar: {
        show: true,
        tools: {
          download: true,
          pan: false,
          zoom: true,
        },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "60%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      type: "datetime",
      labels: {
        format: "dd MMM HH:mm",
      },
    },
    yaxis: {
      title: {
        text: "Amperes (A)",
      },
      labels: {
        formatter: (val) => val.toFixed(1),
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(2)} A`,
      },
      x: {
        format: "dd MMM yyyy - HH:mm",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
  };

  return (
    <div className="h-96 w-full">
      <Chart options={options} series={seriesData} type="bar" height={350} />
    </div>
  );
}
