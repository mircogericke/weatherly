export interface MeteoHourly {
  time: string[];
  temperature_2m: number[];
  precipitation: number[];
  cloud_cover: number[];
  sunshine_duration: number[];
  is_day: number[];
}
