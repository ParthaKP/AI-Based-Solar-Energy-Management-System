/*
  # Allow all authenticated users to read shared monitoring data

  The edge function creates predictions and alerts for the admin user
  based on sensor data. All authenticated users of the household should
  be able to read this data.
*/

-- Predictions: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can read own predictions" ON predictions;
CREATE POLICY "Authenticated users can read predictions"
  ON predictions FOR SELECT
  TO authenticated
  USING (true);

-- Billing data: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can read own billing data" ON billing_data;
CREATE POLICY "Authenticated users can read billing data"
  ON billing_data FOR SELECT
  TO authenticated
  USING (true);

-- Sustainability metrics: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can read own sustainability metrics" ON sustainability_metrics;
CREATE POLICY "Authenticated users can read sustainability metrics"
  ON sustainability_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Load management logs: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can read own load management logs" ON load_management_logs;
CREATE POLICY "Authenticated users can read load management logs"
  ON load_management_logs FOR SELECT
  TO authenticated
  USING (true);

-- Weather logs: allow all authenticated users to read
DROP POLICY IF EXISTS "Users can read own weather logs" ON weather_logs;
CREATE POLICY "Authenticated users can read weather logs"
  ON weather_logs FOR SELECT
  TO authenticated
  USING (true);
