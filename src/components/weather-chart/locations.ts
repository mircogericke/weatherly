import { ScaleLinear } from "d3";
import { WeatherData, WeatherHour } from "../../model/weather-data";
import { DateRange } from "../../model/range";

export function locations(data: WeatherHour[], x: ScaleLinear<number, number>)
{
	const it = (function* () {
		let start = 0;

		for (let i = 0; i < data.length; i++)
		{
			if (data[i].location != data[start].location)
			{
				const s = x(start);
				const e = x(i);
				yield {
					left: s,
					middle: s + ((e - s) / 2),
					name: data[start].location.name,
				};
				start = i;
			}
		}
		
		const s = x(start);
		const e = x(data.length - 1);
		yield {
			left: s,
			middle: s + ((e - s) / 2),
			name: data[start].location.name,
		};
	})();
	return Array.from(it);
}

export function temperatures(data: WeatherData[])
{
	const result: RangeData[] = [];

	const count = data[0].hour.length
	for(let i = 0; i < count; i++)
	{
		const values = data.map(v => v.hour[i].temperature);
		result.push(({
			min: Math.min(...values),
			max: Math.max(...values),
			avg: values.reduce((p,c) => p + c) / values.length,
		}))
	}
	return result;
}

// export function precipitation(data: WeatherData[])
// {
// 	const result: RangeData[] = [];

// 	const count = data[0].hour.length
// 	for(let i = 0; i < count; i++)
// 	{
// 		const values = data.map(v => v.hour[i].precipitation);
// 		result.push(({
// 			min: Math.min(...values),
// 			max: Math.max(...values),
// 			avg: values.reduce((p,c) => p + c) / values.length,
// 		}))
// 	}
// 	return result;
// }

export interface RangeData {
	min: number;
	max: number;
	avg: number;
}

export function dayNight(data: WeatherData, x: ScaleLinear<number, number>, range: DateRange)
{
	const it = (function*()
	{
		let start = 0;
		let day = data.hour[0].isDay;

		for (let i = 0; i < data.hour.length; i++)
		{
			if (data.hour[i].isDay != day)
			{
				const originalStart = start;
				start = i;

				const s = x(originalStart);
				const e = x(start);
				yield {
					start: s,
					width: e - s,
					color: day ? 'yellow' : 'gray',
				};
				day = data.hour[i].isDay;
			}
		}
		
	})();

	return Array.from(it);
}
