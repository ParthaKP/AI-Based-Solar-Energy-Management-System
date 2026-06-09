# AI Smart Solar Monitoring System

A full-stack IoT-based solar panel monitoring application with AI-powered predictions, smart load management, and real-time sensor data visualization.

## Features

- **Real-time Monitoring**: Live sensor data from Arduino/ESP8266 devices
- **AI Predictions**: Solar power forecasting using machine learning algorithms
- **Fault Detection**: Automatic anomaly detection with alerts
- **Smart Load Management**: AI-powered appliance recommendations
- **Google Sheets Integration**: Automatic data sync for backup
- **Sustainability Metrics**: CO2 reduction and carbon footprint tracking
- **User Authentication**: Secure login with Supabase Auth

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/solar-monitoring.git
cd solar-monitoring
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Run the development server

```bash
npm run dev
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/`
3. Deploy the edge function:
   ```bash
   supabase functions deploy solar-api
   ```

## Hardware Integration

POST sensor data to the edge function:

```
POST https://your-project.supabase.co/functions/v1/solar-api/ingest
```

**JSON body:**
```json
{
  "voltage": 22.5,
  "current": 4.2,
  "temperature": 34,
  "humidity": 58,
  "light_intensity": 850,
  "panel_efficiency": 17.5,
  "device_id": "arduino_01"
}
```

### Arduino Example

```cpp

HTTPClient http;
http.begin("https://your-project.supabase.co/functions/v1/solar-api/ingest");
http.addHeader("Content-Type", "application/json");

String payload = "{\"voltage\":" + String(voltage) +
                 ",\"current\":" + String(current) +
                 ",\"temperature\":" + String(temp) +
                 ",\"humidity\":" + String(humidity) +
                 ",\"light_intensity\":" + String(light) +
                 ",\"panel_efficiency\":" + String(efficiency) + "}";

int httpCode = http.POST(payload);
http.end();
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ingest` | POST | Receive sensor data from hardware |
| `/debug` | POST | Debug what hardware is sending |
| `/sensor-data` | GET | Retrieve stored sensor readings |
| `/predict-power` | POST | AI power prediction |
| `/detect-fault` | POST | Fault detection analysis |
| `/load-management` | POST | Smart appliance recommendations |
| `/alerts` | GET | System alerts |
| `/sustainability` | GET | CO2 metrics |

## Screenshots

- Dashboard with real-time charts
- Power prediction with hourly/weekly forecast
- Fault detection alerts
- Smart load management recommendations

## License

MIT
