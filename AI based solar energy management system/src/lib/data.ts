import type { Appliance } from './types';

export const APPLIANCE_DATABASE: Appliance[] = [
  { name: 'Ceiling Fan', power_watts: 75, category: 'comfort', priority: 3, icon: 'Fan' },
  { name: 'LED Bulb (10W)', power_watts: 10, category: 'essential', priority: 1, icon: 'Lightbulb' },
  { name: 'LED Bulb (20W)', power_watts: 20, category: 'essential', priority: 1, icon: 'Lightbulb' },
  { name: 'Refrigerator', power_watts: 150, category: 'essential', priority: 1, icon: 'Refrigerator' },
  { name: 'Laptop', power_watts: 65, category: 'essential', priority: 2, icon: 'Laptop' },
  { name: 'TV (LED 32")', power_watts: 50, category: 'comfort', priority: 3, icon: 'Tv' },
  { name: 'TV (LED 55")', power_watts: 100, category: 'comfort', priority: 3, icon: 'Tv' },
  { name: 'Washing Machine', power_watts: 500, category: 'general', priority: 4, icon: 'WashingMachine' },
  { name: 'Water Pump', power_watts: 750, category: 'essential', priority: 2, icon: 'Droplets' },
  { name: 'Air Conditioner (1 ton)', power_watts: 1200, category: 'luxury', priority: 5, icon: 'AirVent' },
  { name: 'Microwave Oven', power_watts: 800, category: 'general', priority: 4, icon: 'Microwave' },
  { name: 'Iron', power_watts: 1000, category: 'general', priority: 4, icon: 'Iron' },
  { name: 'Phone Charger', power_watts: 15, category: 'essential', priority: 1, icon: 'Smartphone' },
  { name: 'WiFi Router', power_watts: 12, category: 'essential', priority: 1, icon: 'Wifi' },
  { name: 'Desktop Computer', power_watts: 250, category: 'general', priority: 3, icon: 'Monitor' },
  { name: 'Electric Kettle', power_watts: 1500, category: 'luxury', priority: 5, icon: 'Coffee' },
];

export const TARIFF_RATES = {
  domestic_standard: 0.12,
  domestic_peak: 0.18,
  domestic_off_peak: 0.08,
  commercial: 0.15,
};

export const CO2_FACTOR_KG_PER_KWH = 0.42;
export const TREES_PER_TONNE_CO2 = 45;
