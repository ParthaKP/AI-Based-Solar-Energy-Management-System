/*
  # Add sensor data read policy for edge function access

  1. Changes
    - Add a policy allowing authenticated users to read all sensor data (not just their own)
      This is needed because the dashboard needs to show real-time data from the Arduino device
      which posts via the edge function using a service account user_id.
    - The edge function uses the service role key which bypasses RLS, but the frontend
      Supabase client needs to read sensor data for the dashboard.

  2. Security
    - Replace the restrictive "Users can read own sensor data" policy with a more permissive
      read policy since sensor data from the shared Arduino device should be visible to all
      authenticated users of the household.
    - Insert policy remains restricted to own data + service role.
*/

-- Drop the existing restrictive read policy
DROP POLICY IF EXISTS "Users can read own sensor data" ON sensor_data;

-- Allow all authenticated users to read sensor data (shared household monitoring device)
CREATE POLICY "Authenticated users can read sensor data"
  ON sensor_data FOR SELECT
  TO authenticated
  USING (true);

-- Also add a policy for alerts read access
DROP POLICY IF EXISTS "Users can read own alerts" ON alerts;
CREATE POLICY "Authenticated users can read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);
