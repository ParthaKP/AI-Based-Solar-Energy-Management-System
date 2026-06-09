import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SensorData } from '../lib/types';

interface SensorDataResult {
  current: SensorData | null;
  history: SensorData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSensorData(limit: number = 48, pollInterval: number = 5000): SensorDataResult {
  const [current, setCurrent] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('sensor_data')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setCurrent(data[0]);
        setHistory([...data].reverse());
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  return { current, history, loading, error, refetch: fetchData };
}

export function useSensorStats(days: number = 30) {
  const [data, setData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    supabase
      .from('sensor_data')
      .select('*')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true })
      .then(({ data: d }) => {
        setData(d || []);
        setLoading(false);
      });
  }, [days]);

  return { data, loading };
}

/**
 * Posts sensor data to the edge function /ingest endpoint.
 * This is the same endpoint the Arduino/ESP8266 hardware posts to.
 * The edge function stores data in Supabase AND forwards to Google Sheet.
 */
export async function postSensorReading(reading: {
  voltage: number;
  current: number;
  power?: number;
  temperature: number;
  humidity: number;
  light_intensity: number;
  panel_efficiency: number;
  device_id?: string;
  user_id?: string;
}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/solar-api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reading),
  });
  return res.json();
}

/**
 * Syncs Google Sheet data rows into Supabase by posting them to the /sync-sheet endpoint.
 */
export async function syncSheetRows(rows: Array<Record<string, unknown>>, userId?: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/solar-api/sync-sheet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows, user_id: userId }),
  });
  return res.json();
}
