import { Temporal } from "temporal-polyfill";
import { QueryLocation } from "./location";
import { WeatherQuery } from "./query";
import { MeteoWeatherData } from "./openmeteo";

export interface WeatherData {
	year: number;
	hour: WeatherHour[];
}

export interface WeatherHour {
	location: QueryLocation;
	time: Temporal.PlainDateTime;
	temperature: number;
	precipitation: number;
	cloudCover: number;
	sunshineDuration: number;
	isDay: boolean;
}

function hasLocation(date: Temporal.PlainDateTime, query: WeatherQuery)
{
	return Temporal.PlainDate.compare(date, query.dates.end.with({ year: date.year })) <= 0;
}

export function parseResponse(query: WeatherQuery[], data: MeteoWeatherData[][]): WeatherData[]
{
	const queryYear = query[0].dates.start.year;

	return data.map(d =>
	{
		const locations = d.map(l => parseData(query, l));

		const result: WeatherData = {
			year: locations[0].time[0].year,
			hour: [],
		};

		let locIndex = 0;
		let i = 0;

		for(locIndex = 0; locIndex < query.length; locIndex++)
		{
			const loc = locations[locIndex]
			const time = loc.time;
			
			const firstYear = time[0].year;

			for (i; i < time.length; i++)
			{
				if (hasLocation(time[i], query[locIndex]))
				{
					const diff = time[i].year - firstYear;

					result.hour.push({
						cloudCover: loc.cloudCover[i],
						isDay: loc.isDay[i],
						location: loc.location[i],
						precipitation: loc.precipitation[i],
						sunshineDuration: loc.sunshineDuration[i],
						temperature: loc.temperature[i],
						time: time[i].with({ year: queryYear + diff }),
					});
				}
				else
				{
					break;
				}
			}
		}

		return result;
	});
}

function parseData(query: WeatherQuery[], data: MeteoWeatherData): {[K in keyof WeatherHour]: WeatherHour[K][] }
{
	const h = data.hourly;

	const loc = query[data.location_id ?? 0].location;

	return {
		location: h.time.map(() => loc),
		time: h.time.map(v => Temporal.PlainDateTime.from(v)),
		isDay: h.is_day.map(v => !!v),
		cloudCover: h.cloud_cover,
		temperature: h.temperature_2m,
		precipitation: h.precipitation,
		sunshineDuration: h.sunshine_duration,
	};
}
