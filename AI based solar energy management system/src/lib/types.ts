export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  household_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  user_id: string;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  humidity: number;
  light_intensity: number;
  panel_efficiency: number;
  device_id: string;
  is_online: boolean;
  recorded_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  predicted_power: number;
  predicted_energy: number;
  predicted_bill: number;
  confidence_score: number;
  prediction_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  model_version: string;
  input_features: Record<string, number>;
  target_date: string;
  created_at: string;
}

export type AlertType = 'fault' | 'high_usage' | 'low_efficiency' | 'device_offline' | 'overload_risk' | 'weather_warning';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  user_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  is_read: boolean;
  sensor_value: number;
  threshold_value: number;
  created_at: string;
}

export interface SustainabilityMetric {
  id: string;
  user_id: string;
  co2_reduction_kg: number;
  renewable_percentage: number;
  energy_efficiency_score: number;
  carbon_savings_kg: number;
  trees_equivalent: number;
  sustainability_score: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recorded_at: string;
}

export interface ApplianceUsage {
  id: string;
  user_id: string;
  appliance_name: string;
  power_rating_watts: number;
  recommended_runtime_hours: number;
  actual_runtime_hours: number;
  is_active: boolean;
  category: 'essential' | 'comfort' | 'luxury' | 'general';
  priority: number;
  recorded_at: string;
}

export interface WeatherLog {
  id: string;
  user_id: string;
  weather_condition: string;
  temperature_c: number;
  humidity_percent: number;
  cloud_cover_percent: number;
  wind_speed_kmh: number;
  solar_intensity: number;
  uv_index: number;
  forecast: WeatherForecastItem[];
  recorded_at: string;
}

export interface WeatherForecastItem {
  time: string;
  condition: string;
  temperature: number;
  cloud_cover: number;
  solar_intensity: number;
}

export interface BillingData {
  id: string;
  user_id: string;
  energy_consumed_kwh: number;
  energy_generated_kwh: number;
  energy_exported_kwh: number;
  grid_dependency_percent: number;
  solar_contribution_percent: number;
  daily_cost: number;
  monthly_cost: number;
  solar_savings: number;
  tariff_rate: number;
  period: 'daily' | 'monthly';
  recorded_at: string;
}

export interface LoadManagementLog {
  id: string;
  user_id: string;
  available_solar_watts: number;
  total_demand_watts: number;
  recommended_appliances: ApplianceRecommendation[];
  avoided_appliances: ApplianceRecommendation[];
  optimization_score: number;
  weather_condition: string;
  strategy: 'eco' | 'balanced' | 'comfort';
  recorded_at: string;
}

export interface ApplianceRecommendation {
  name: string;
  power_watts: number;
  max_runtime_hours: number;
  category: string;
  priority: number;
}

export interface Appliance {
  name: string;
  power_watts: number;
  category: 'essential' | 'comfort' | 'luxury' | 'general';
  priority: number;
  icon: string;
}
