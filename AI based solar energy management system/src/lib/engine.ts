import type { ApplianceRecommendation } from './types';
import { APPLIANCE_DATABASE, CO2_FACTOR_KG_PER_KWH, TARIFF_RATES } from './data';

export function calculateLoadRecommendations(
  availableSolarWatts: number,
  weatherCondition: string,
  _predictedPower: number,
  _currentDemand: number,
  strategy: 'eco' | 'balanced' | 'comfort' = 'balanced'
): { recommended: ApplianceRecommendation[]; avoided: ApplianceRecommendation[]; optimizationScore: number } {
  let effectiveSolar = availableSolarWatts;

  if (weatherCondition === 'cloudy') effectiveSolar *= 0.5;
  if (weatherCondition === 'overcast') effectiveSolar *= 0.2;
  if (weatherCondition === 'rainy') effectiveSolar *= 0.1;

  effectiveSolar = effectiveSolar * 0.85;

  const sortedAppliances = [...APPLIANCE_DATABASE].sort((a, b) => a.priority - b.priority);

  const recommended: ApplianceRecommendation[] = [];
  const avoided: ApplianceRecommendation[] = [];
  let remainingPower = effectiveSolar;

  for (const appliance of sortedAppliances) {
    if (remainingPower >= appliance.power_watts) {
      const maxHours = Math.round((remainingPower / appliance.power_watts) * (strategy === 'eco' ? 0.6 : strategy === 'comfort' ? 1.0 : 0.8) * 10) / 10;
      recommended.push({
        name: appliance.name,
        power_watts: appliance.power_watts,
        max_runtime_hours: Math.min(maxHours, strategy === 'comfort' ? 10 : 8),
        category: appliance.category,
        priority: appliance.priority,
      });
      if (strategy !== 'comfort') {
        remainingPower -= appliance.power_watts * 0.5;
      } else {
        remainingPower -= appliance.power_watts * 0.3;
      }
    } else {
      avoided.push({
        name: appliance.name,
        power_watts: appliance.power_watts,
        max_runtime_hours: 0,
        category: appliance.category,
        priority: appliance.priority,
      });
    }
  }

  const totalRecommended = recommended.reduce((s, a) => s + a.power_watts, 0);
  const totalAvailable = APPLIANCE_DATABASE.reduce((s, a) => s + a.power_watts, 0);
  const optimizationScore = Math.round((totalRecommended / totalAvailable) * 100);

  return { recommended, avoided, optimizationScore };
}

export function estimateBill(
  energyConsumedKwh: number,
  energyGeneratedKwh: number,
  tariffRate: number = TARIFF_RATES.domestic_standard
): { dailyCost: number; monthlyCost: number; solarSavings: number; gridDependency: number; solarContribution: number } {
  const gridEnergy = Math.max(0, energyConsumedKwh - energyGeneratedKwh);
  const solarContribution = energyConsumedKwh > 0 ? (energyGeneratedKwh / energyConsumedKwh) * 100 : 0;
  const gridDependency = 100 - Math.min(100, solarContribution);

  const dailyCost = gridEnergy * tariffRate;
  const monthlyCost = dailyCost * 30;
  const solarSavings = Math.min(energyGeneratedKwh, energyConsumedKwh) * tariffRate;

  return {
    dailyCost: Math.round(dailyCost * 100) / 100,
    monthlyCost: Math.round(monthlyCost * 100) / 100,
    solarSavings: Math.round(solarSavings * 100) / 100,
    gridDependency: Math.round(gridDependency),
    solarContribution: Math.round(Math.min(100, solarContribution)),
  };
}

export function calculateSustainability(
  energyGeneratedKwh: number,
  energyConsumedKwh: number
): { co2Reduction: number; carbonSavings: number; treesEquivalent: number; renewablePercentage: number; efficiencyScore: number } {
  const co2Reduction = energyGeneratedKwh * CO2_FACTOR_KG_PER_KWH;
  const carbonSavings = co2Reduction;
  const treesEquivalent = (co2Reduction / 1000) * 45;
  const renewablePercentage = energyConsumedKwh > 0 ? (energyGeneratedKwh / energyConsumedKwh) * 100 : 0;
  const efficiencyScore = Math.min(100, renewablePercentage * 1.2);

  return {
    co2Reduction: Math.round(co2Reduction * 100) / 100,
    carbonSavings: Math.round(carbonSavings * 100) / 100,
    treesEquivalent: Math.round(treesEquivalent * 100) / 100,
    renewablePercentage: Math.round(Math.min(100, renewablePercentage)),
    efficiencyScore: Math.round(efficiencyScore),
  };
}

export function detectFaults(readings: {
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  panelEfficiency: number;
}): { isAnomaly: boolean; faults: { type: string; severity: 'info' | 'warning' | 'critical'; message: string }[] } {
  const faults: { type: string; severity: 'info' | 'warning' | 'critical'; message: string }[] = [];

  if (readings.voltage < 12) {
    faults.push({
      type: 'voltage_anomaly',
      severity: 'critical',
      message: `Voltage at ${readings.voltage.toFixed(1)}V is critically low. Expected 18-24V range.`,
    });
  } else if (readings.voltage < 16) {
    faults.push({
      type: 'voltage_anomaly',
      severity: 'warning',
      message: `Voltage at ${readings.voltage.toFixed(1)}V is below optimal range.`,
    });
  }

  if (readings.current < 0.5 && readings.voltage > 10) {
    faults.push({
      type: 'current_anomaly',
      severity: 'warning',
      message: `Current at ${readings.current.toFixed(2)}A is unusually low for active voltage.`,
    });
  }

  if (readings.power < 10 && readings.voltage > 10 && readings.current > 0.3) {
    faults.push({
      type: 'power_drop',
      severity: 'warning',
      message: 'Power output dropped unexpectedly. Possible panel issue.',
    });
  }

  if (readings.panelEfficiency < 10) {
    faults.push({
      type: 'low_efficiency',
      severity: readings.panelEfficiency < 5 ? 'critical' : 'warning',
      message: `Panel efficiency at ${readings.panelEfficiency.toFixed(1)}%. ${readings.panelEfficiency < 5 ? 'Check for damage or shading.' : 'Consider cleaning panels.'}`,
    });
  }

  if (readings.temperature > 65) {
    faults.push({
      type: 'overheating',
      severity: 'critical',
      message: `Temperature at ${readings.temperature.toFixed(1)}C exceeds safe limit. Risk of damage.`,
    });
  } else if (readings.temperature > 55) {
    faults.push({
      type: 'overheating',
      severity: 'warning',
      message: `Temperature at ${readings.temperature.toFixed(1)}C is high. Monitor closely.`,
    });
  }

  return {
    isAnomaly: faults.length > 0,
    faults,
  };
}

export function predictSolarPower(
  temperature: number,
  humidity: number,
  lightIntensity: number,
  cloudCover: number
): { predictedPower: number; confidence: number; hourlyForecast: { hour: number; power: number }[] } {
  const baseEfficiency = 0.18;
  const tempFactor = Math.max(0, 1 - Math.abs(temperature - 25) * 0.004);
  const humidityFactor = Math.max(0, 1 - humidity * 0.005);
  const lightFactor = Math.min(1, lightIntensity / 1000);
  const cloudFactor = Math.max(0, 1 - cloudCover / 100);

  const maxPanelWatts = 300;
  const predictedPower = maxPanelWatts * baseEfficiency * tempFactor * humidityFactor * lightFactor * cloudFactor * 5.5;

  const confidence = 70 + lightFactor * 15 + cloudFactor * 10 + (1 - humidity / 100) * 5;

  const hourlyForecast = Array.from({ length: 24 }, (_, hour) => {
    const solarAngle = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const hourPower = predictedPower * solarAngle * (0.9 + Math.random() * 0.1);
    return { hour, power: Math.round(hourPower * 100) / 100 };
  });

  return {
    predictedPower: Math.round(predictedPower * 100) / 100,
    confidence: Math.round(Math.min(95, confidence) * 10) / 10,
    hourlyForecast,
  };
}
