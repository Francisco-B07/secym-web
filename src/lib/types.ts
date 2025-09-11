/**
 * Representa la estructura de la tabla 'clients' en la base de datos.
 */

export interface Client {
  id: string;
  name: string;
  created_at: string;
}

export interface ProbeConfig {
  id: string;
  name: string;
  alerts_enabled: boolean;
}

export interface CurrentSensorConfig {
  id: string;
  name: string;
}

export interface SensorConfig {
  probes?: ProbeConfig[];
  currents?: CurrentSensorConfig[];
}

export interface Device {
  id: string;
  node_id: string;
  client_id: string;
  location: string;
  created_at: string;
  sensor_config: SensorConfig | null;
  device_type?: "refrigerator" | "hvac";
  min_temp_threshold?: number | null;
  max_temp_threshold?: number | null;
  clients: { name: string } | null;
}

export interface SensorReading {
  timestamp: string; // ISO 8601 string
  ambient_temp: number | null;
  ambient_hum: number | null;
  current_a: number | null;
  current_b: number | null;
  probe_temperatures: number[] | null;
}

// Tipos combinados para las vistas del dashboard
export type DeviceWithStatus = Device & {
  latest_reading: SensorReading | null;
  status: "ok" | "warning" | "critical" | "offline";
};

export type ClientWithStatus = Client & {
  device_status_counts: {
    ok: number;
    warning: number;
    critical: number;
    offline: number;
  };
};

/**
 * Representa la estructura del resultado de nuestra consulta específica
 * para el dashboard del administrador, que une un perfil con el email del usuario.
 */
export interface ProfileWithUserEmail {
  id: string;
  // El objeto 'users' representa la tabla unida (joined).
  // Puede ser nulo si la relación no se encuentra o no hay un usuario correspondiente.
  users: {
    email: string | null;
  }[];
}

export type User = {
  id: string;
  email: string;
  role: string;
  clientId: string | null;
  clientName: string;
};

export interface ChartDataPoint {
  x: number; // Timestamp en milisegundos
  y: number | null;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
}

export interface ChartProps {
  seriesData: ChartSeries[];
  isLoading?: boolean;
}

export interface Alert {
  id: number;
  device_id: string;
  client_id: string;
  alert_type: "TEMP_CRITICAL" | "CURRENT_HIGH" | "OFFLINE";
  details: string | null;
  timestamp: string; // ISO 8601 string
  status: "new" | "acknowledged" | "resolved";
}

export interface Kpis {
  total_clients: number;
  total_devices: number;
  ok_devices: number;
  warning_devices: number;
  critical_devices: number;
  offline_devices: number;
}

export type AlertWithRelations = Alert & {
  clients: { name: string } | null;
  devices: { location: string } | null;
};
