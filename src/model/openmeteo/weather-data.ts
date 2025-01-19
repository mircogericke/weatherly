import { MeteoHourly } from "./hourly";
import { MeteoHourlyUnits } from "./hourly-units";

export interface MeteoWeatherData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: MeteoHourlyUnits;
  hourly: MeteoHourly;
  location_id?: number;
}

