import type { SensorData, Prediction, Alert, WeatherLog, BillingData, SustainabilityMetric, LoadManagementLog } from './types';

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

export function generateMockSensorData(count: number): SensorData[] {
  const data: SensorData[] = [];
  for (let i = 0; i < count; i++) {
    const hour = new Date().getHours() - (count - i);
    const solarFactor = Math.max(0, Math.sin(((hour + 6) / 12) * Math.PI));
    const cloudFactor = 0.7 + Math.random() * 0.3;
    const voltage = 18 + solarFactor * 6 * cloudFactor;
    const current = solarFactor * 5.5 * cloudFactor;
    const power = voltage * current;

    data.push({
      id: `mock-${i}`,
      user_id: 'mock',
      voltage: Math.round(voltage * 100) / 100,
      current: Math.round(current * 100) / 100,
      power: Math.round(power * 100) / 100,
      temperature: 22 + solarFactor * 15 + (Math.random() - 0.5) * 3,
      humidity: 60 - solarFactor * 20 + (Math.random() - 0.5) * 10,
      light_intensity: solarFactor * 1000 * cloudFactor,
      panel_efficiency: 15 + solarFactor * 8 * cloudFactor,
      device_id: 'arduino_01',
      is_online: true,
      recorded_at: hoursAgo(count - i),
    });
  }
  return data;
}

export function generateMockPredictions(): Prediction[] {
  const data: Prediction[] = [];
  for (let i = 0; i < 24; i++) {
    const solarFactor = Math.max(0, Math.sin(((i + 6) / 12) * Math.PI));
    const predicted = solarFactor * 120 * (0.8 + Math.random() * 0.2);
    data.push({
      id: `pred-${i}`,
      user_id: 'mock',
      predicted_power: Math.round(predicted * 100) / 100,
      predicted_energy: Math.round(predicted * 0.25 * 100) / 100,
      predicted_bill: Math.round(predicted * 0.12 * 0.01 * 100) / 100,
      confidence_score: 75 + Math.random() * 20,
      prediction_type: 'hourly',
      model_version: 'rf_v1',
      input_features: {},
      target_date: new Date(Date.now() + i * 3600000).toISOString(),
      created_at: new Date().toISOString(),
    });
  }
  return data;
}

export function generateMockAlerts(): Alert[] {
  return [
    {
      id: 'alert-1',
      user_id: 'mock',
      alert_type: 'fault',
      severity: 'critical',
      title: 'Voltage Anomaly Detected',
      message: 'Panel voltage dropped to 8V, well below normal operating range of 18-24V. Check connections.',
      is_read: false,
      sensor_value: 8,
      threshold_value: 16,
      created_at: hoursAgo(0.5),
    },
    {
      id: 'alert-2',
      user_id: 'mock',
      alert_type: 'high_usage',
      severity: 'warning',
      title: 'High Energy Consumption',
      message: 'Current power draw exceeds solar generation by 200W. Grid dependency increased.',
      is_read: false,
      sensor_value: 800,
      threshold_value: 600,
      created_at: hoursAgo(1),
    },
    {
      id: 'alert-3',
      user_id: 'mock',
      alert_type: 'low_efficiency',
      severity: 'info',
      title: 'Panel Efficiency Below Average',
      message: 'Panel efficiency at 12%. Consider cleaning panels or checking for shading.',
      is_read: true,
      sensor_value: 12,
      threshold_value: 18,
      created_at: hoursAgo(3),
    },
    {
      id: 'alert-4',
      user_id: 'mock',
      alert_type: 'overload_risk',
      severity: 'warning',
      title: 'Overload Risk Warning',
      message: 'Total appliance demand (1800W) exceeds available solar (400W). Reduce load.',
      is_read: false,
      sensor_value: 1800,
      threshold_value: 400,
      created_at: hoursAgo(0.2),
    },
    {
      id: 'alert-5',
      user_id: 'mock',
      alert_type: 'weather_warning',
      severity: 'info',
      title: 'Cloud Cover Increasing',
      message: 'Heavy cloud cover expected in next 2 hours. Solar output may drop 60%.',
      is_read: false,
      sensor_value: 85,
      threshold_value: 50,
      created_at: hoursAgo(0.1),
    },
  ];
}

export function generateMockWeather(): WeatherLog {
  const hour = new Date().getHours();
  const solarFactor = Math.max(0, Math.sin(((hour + 6) / 12) * Math.PI));

  return {
    id: 'weather-mock',
    user_id: 'mock',
    weather_condition: solarFactor > 0.5 ? 'clear' : 'partly_cloudy',
    temperature_c: 28 + (Math.random() - 0.5) * 5,
    humidity_percent: 45 + Math.random() * 20,
    cloud_cover_percent: 20 + Math.random() * 40,
    wind_speed_kmh: 5 + Math.random() * 10,
    solar_intensity: solarFactor * 950,
    uv_index: solarFactor * 10,
    forecast: Array.from({ length: 8 }, (_, i) => {
      const fHour = hour + i * 3;
      const fSolar = Math.max(0, Math.sin(((fHour + 6) / 12) * Math.PI));
      return {
        time: new Date(Date.now() + i * 3 * 3600000).toISOString(),
        condition: fSolar > 0.5 ? 'clear' : fSolar > 0.2 ? 'partly_cloudy' : 'cloudy',
        temperature: 26 + fSolar * 8 + (Math.random() - 0.5) * 3,
        cloud_cover: 30 + Math.random() * 40,
        solar_intensity: fSolar * 900,
      };
    }),
    recorded_at: new Date().toISOString(),
  };
}

export function generateMockBilling(): BillingData[] {
  const data: BillingData[] = [];
  for (let i = 30; i >= 0; i--) {
    const solarFactor = 0.3 + Math.random() * 0.4;
    const consumed = 8 + Math.random() * 6;
    const generated = consumed * solarFactor;

    data.push({
      id: `bill-${i}`,
      user_id: 'mock',
      energy_consumed_kwh: Math.round(consumed * 100) / 100,
      energy_generated_kwh: Math.round(generated * 100) / 100,
      energy_exported_kwh: Math.round(Math.max(0, generated - consumed * 0.5) * 100) / 100,
      grid_dependency_percent: Math.round((1 - solarFactor) * 100),
      solar_contribution_percent: Math.round(solarFactor * 100),
      daily_cost: Math.round(consumed * 0.12 * 100) / 100,
      monthly_cost: Math.round(consumed * 0.12 * 30 * 100) / 100,
      solar_savings: Math.round(generated * 0.12 * 100) / 100,
      tariff_rate: 0.12,
      period: 'daily',
      recorded_at: hoursAgo(i * 24),
    });
  }
  return data;
}

export function generateMockSustainability(): SustainabilityMetric[] {
  const data: SustainabilityMetric[] = [];
  for (let i = 30; i >= 0; i--) {
    const solarKwh = 5 + Math.random() * 8;
    const co2Saved = solarKwh * 0.42;
    data.push({
      id: `sust-${i}`,
      user_id: 'mock',
      co2_reduction_kg: Math.round(co2Saved * 100) / 100,
      renewable_percentage: 30 + Math.random() * 40,
      energy_efficiency_score: 65 + Math.random() * 25,
      carbon_savings_kg: Math.round(co2Saved * 100) / 100,
      trees_equivalent: Math.round((co2Saved / 1000) * 45 * 100) / 100,
      sustainability_score: 60 + Math.random() * 30,
      period: 'daily',
      recorded_at: hoursAgo(i * 24),
    });
  }
  return data;
}

export function generateMockLoadManagement(): LoadManagementLog[] {
  const data: LoadManagementLog[] = [];
  const conditions = ['clear', 'partly_cloudy', 'cloudy', 'overcast'];

  for (let i = 6; i >= 0; i--) {
    const available = conditions[i % 4] === 'clear' ? 800 : conditions[i % 4] === 'partly_cloudy' ? 500 : conditions[i % 4] === 'cloudy' ? 250 : 100;
    data.push({
      id: `load-${i}`,
      user_id: 'mock',
      available_solar_watts: available,
      total_demand_watts: available + Math.random() * 400,
      recommended_appliances: [
        { name: 'LED Bulbs', power_watts: 40, max_runtime_hours: 8, category: 'essential', priority: 1 },
        { name: 'WiFi Router', power_watts: 12, max_runtime_hours: 24, category: 'essential', priority: 1 },
        { name: 'Refrigerator', power_watts: 150, max_runtime_hours: available > 300 ? 6 : 2, category: 'essential', priority: 1 },
        { name: 'Laptop', power_watts: 65, max_runtime_hours: available > 400 ? 5 : 1, category: 'essential', priority: 2 },
        { name: 'Fan', power_watts: 75, max_runtime_hours: available > 500 ? 6 : 2, category: 'comfort', priority: 3 },
      ],
      avoided_appliances: available < 500
        ? [{ name: 'Washing Machine', power_watts: 500, max_runtime_hours: 0, category: 'general', priority: 4 }]
        : [],
      optimization_score: 50 + Math.random() * 40,
      weather_condition: conditions[i % 4],
      strategy: 'balanced',
      recorded_at: hoursAgo(i * 4),
    });
  }
  return data;
}
