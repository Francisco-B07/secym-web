"use client";

import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { type ChartSeries } from "@/lib/types";

interface TemperatureChartProps {
  seriesData: ChartSeries[];
  minThreshold: number;
  maxThreshold: number;
  isLoading?: boolean;
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
}: TemperatureChartProps) {
  // 1. PROCESAMIENTO DE DATOS PARA RESALTAR ANOMALÍAS
  // Esta es la lógica clave. Creamos nuevas series que solo contienen los puntos
  // que están fuera de los umbrales para poder darles un estilo diferente.
  const processedSeries = useMemo(() => {
    const finalSeries: ChartSeries[] = [];

    seriesData.forEach((series) => {
      const normalPoints: { x: number; y: number | null }[] = [];
      const anomalyPoints: { x: number; y: number | null }[] = [];

      series.data.forEach((point) => {
        if (
          point.y !== null &&
          (point.y < minThreshold || point.y > maxThreshold)
        ) {
          anomalyPoints.push(point);
        } else {
          // Para mantener la continuidad de la línea, añadimos un punto nulo donde hay una anomalía
          if (
            normalPoints.length > 0 &&
            normalPoints[normalPoints.length - 1].y !== null
          ) {
            normalPoints.push({ x: point.x, y: point.y });
          } else if (point.y !== null) {
            normalPoints.push(point);
          }
        }
      });

      // Añadimos la serie con los puntos normales
      finalSeries.push({
        name: series.name,
        data: normalPoints,
      });

      // Añadimos una serie separada solo para las anomalías, que renderizaremos como puntos rojos
      if (anomalyPoints.length > 0) {
        finalSeries.push({
          name: `${series.name} (Anomalía)`,
          data: anomalyPoints,
        });
      }
    });

    return finalSeries;
  }, [seriesData, minThreshold, maxThreshold]);

  // 2. CONFIGURACIÓN AVANZADA DE APEXCHARTS
  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      zoom: {
        type: "x",
        enabled: true,
        autoScaleYaxis: true,
      },
      toolbar: {
        autoSelected: "zoom",
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
    },
    // Asignamos colores y estilos distintos a las series normales y a las de anomalías
    colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#FF4560"], // Colores para las sondas + rojo para anomalías
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: [3, 3, 3, 3, 3, 0], // Hacemos que la línea de la anomalía sea invisible (ancho 0)
    },
    // Configuramos los puntos (markers)
    markers: {
      size: [0, 0, 0, 0, 0, 6], // Hacemos los puntos de la anomalía más grandes (tamaño 6)
      hover: { sizeOffset: 4 },
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
      x: { format: "dd MMM yyyy, HH:mm" },
    },
    legend: {
      // Ocultamos las leyendas de las series de anomalías
      formatter: (seriesName) =>
        seriesName.includes("(Anomalía)") ? "" : seriesName,
    },
    // Mensaje a mostrar si no hay datos
    noData: {
      text: "No hay datos disponibles para el rango de tiempo seleccionado.",
      align: "center",
      verticalAlign: "middle",
      offsetY: -20,
      style: {
        fontSize: "16px",
        color: "#666",
      },
    },
  };

  if (isLoading) {
    return <ChartSkeleton />;
  }

  return (
    <div id="temperature-chart" className="w-full">
      <Chart
        options={options}
        series={processedSeries}
        type="line"
        height={400}
      />
    </div>
  );
}
