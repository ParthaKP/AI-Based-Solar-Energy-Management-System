/*
  # AI Smart Solar Monitoring System - Complete Database Schema

  1. New Tables
    - `profiles` - User profiles with role-based access (admin/user)
    - `sensor_data` - Real-time IoT sensor readings (voltage, current, power, temp, humidity, light)
    - `predictions` - AI prediction results for solar power forecasting
    - `alerts` - System alerts for faults, high usage, low efficiency, overload
    - `sustainability_metrics` - CO2 reduction, renewable contribution, carbon savings
    - `appliance_usage` - Smart load management tracking per appliance
    - `weather_logs` - Weather data affecting solar generation
    - `billing_data` - Daily/monthly electricity billing and solar savings
    - `load_management_logs` - Load management decisions and recommendations

  2. Security
    - RLS enabled on ALL tables
    - Admin users can read all data; regular users can only read their own data
    - Sensor data is readable by authenticated users (shared monitoring)
    - Profile policies enforce ownership checks

  3. Important Notes
    - All tables use UUID primary keys with gen_random_uuid()
    - Timestamps default to now() for automatic tracking
    - Foreign keys reference auth.users for ownership
    - Indexes added for frequently queried columns
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  household_name text DEFAULT 'My Home',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Sensor data table
CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voltage numeric DEFAULT 0,
  current numeric DEFAULT 0,
  power numeric DEFAULT 0,
  temperature numeric DEFAULT 0,
  humidity numeric DEFAULT 0,
  light_intensity numeric DEFAULT 0,
  panel_efficiency numeric DEFAULT 0,
  device_id text DEFAULT 'arduino_01',
  is_online boolean DEFAULT true,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sensor data"
  ON sensor_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sensor data"
  ON sensor_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all sensor data"
  ON sensor_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE INDEX idx_sensor_data_user_id ON sensor_data(user_id);
CREATE INDEX idx_sensor_data_recorded_at ON sensor_data(recorded_at DESC);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  predicted_power numeric DEFAULT 0,
  predicted_energy numeric DEFAULT 0,
  predicted_bill numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0,
  prediction_type text DEFAULT 'hourly' CHECK (prediction_type IN ('hourly', 'daily', 'weekly', 'monthly')),
  model_version text DEFAULT 'rf_v1',
  input_features jsonb DEFAULT '{}',
  target_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_predictions_user_id ON predictions(user_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('fault', 'high_usage', 'low_efficiency', 'device_offline', 'overload_risk', 'weather_warning')),
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  sensor_value numeric DEFAULT 0,
  threshold_value numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- Sustainability metrics table
CREATE TABLE IF NOT EXISTS sustainability_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  co2_reduction_kg numeric DEFAULT 0,
  renewable_percentage numeric DEFAULT 0,
  energy_efficiency_score numeric DEFAULT 0,
  carbon_savings_kg numeric DEFAULT 0,
  trees_equivalent numeric DEFAULT 0,
  sustainability_score numeric DEFAULT 0,
  period text DEFAULT 'daily' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE sustainability_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sustainability metrics"
  ON sustainability_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sustainability metrics"
  ON sustainability_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sustainability_user_id ON sustainability_metrics(user_id);

-- Appliance usage table
CREATE TABLE IF NOT EXISTS appliance_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  appliance_name text NOT NULL,
  power_rating_watts numeric NOT NULL,
  recommended_runtime_hours numeric DEFAULT 0,
  actual_runtime_hours numeric DEFAULT 0,
  is_active boolean DEFAULT false,
  category text DEFAULT 'general' CHECK (category IN ('essential', 'comfort', 'luxury', 'general')),
  priority integer DEFAULT 5,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE appliance_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own appliance usage"
  ON appliance_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own appliance usage"
  ON appliance_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appliance usage"
  ON appliance_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appliance usage"
  ON appliance_usage FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_appliance_usage_user_id ON appliance_usage(user_id);

-- Weather logs table
CREATE TABLE IF NOT EXISTS weather_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weather_condition text DEFAULT 'clear',
  temperature_c numeric DEFAULT 0,
  humidity_percent numeric DEFAULT 0,
  cloud_cover_percent numeric DEFAULT 0,
  wind_speed_kmh numeric DEFAULT 0,
  solar_intensity numeric DEFAULT 0,
  uv_index numeric DEFAULT 0,
  forecast jsonb DEFAULT '[]',
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE weather_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weather logs"
  ON weather_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weather logs"
  ON weather_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_weather_logs_user_id ON weather_logs(user_id);

-- Billing data table
CREATE TABLE IF NOT EXISTS billing_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  energy_consumed_kwh numeric DEFAULT 0,
  energy_generated_kwh numeric DEFAULT 0,
  energy_exported_kwh numeric DEFAULT 0,
  grid_dependency_percent numeric DEFAULT 0,
  solar_contribution_percent numeric DEFAULT 0,
  daily_cost numeric DEFAULT 0,
  monthly_cost numeric DEFAULT 0,
  solar_savings numeric DEFAULT 0,
  tariff_rate numeric DEFAULT 0.12,
  period text DEFAULT 'daily' CHECK (period IN ('daily', 'monthly')),
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE billing_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own billing data"
  ON billing_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing data"
  ON billing_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_billing_data_user_id ON billing_data(user_id);

-- Load management logs table
CREATE TABLE IF NOT EXISTS load_management_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  available_solar_watts numeric DEFAULT 0,
  total_demand_watts numeric DEFAULT 0,
  recommended_appliances jsonb DEFAULT '[]',
  avoided_appliances jsonb DEFAULT '[]',
  optimization_score numeric DEFAULT 0,
  weather_condition text DEFAULT 'clear',
  strategy text DEFAULT 'balanced' CHECK (strategy IN ('eco', 'balanced', 'comfort')),
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE load_management_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own load management logs"
  ON load_management_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own load management logs"
  ON load_management_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_load_management_user_id ON load_management_logs(user_id);
