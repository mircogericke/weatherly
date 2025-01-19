import { afterRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, resource, signal, Signal } from '@angular/core';
import { WeatherQuery } from '../../model/query';
import { DateRange } from '../../model/range';
import { Temporal } from 'temporal-polyfill';
import { QueryLocation } from '../../model/location';
import { MeteoWeatherData } from '../../model/openmeteo';
import { parseResponse } from '../../model/weather-data';
import { WeatherChartComponent } from '../../components/weather-chart/weather-chart.component';
import VacationPlannerComponent from '../vacation-planner/vacation-planner.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

const openMeteo = "https://archive-api.open-meteo.com/v1/archive";

@Component({
	selector: 'app-weather-view',
	imports: [
		MatCheckboxModule,
		FormsModule,
		WeatherChartComponent
	],
	templateUrl: './weather-view.component.html',
	styleUrl: './weather-view.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WeatherViewComponent
{
	protected readonly width = signal(0);

	protected readonly showNight = signal(false);
	protected readonly showMinMax = signal(false);

	public constructor()
	{
		const element= inject(ElementRef);
		afterRender({
			read: () => this.width.set(element.nativeElement.clientWidth)
		});
	}

	public readonly queries = <Signal<WeatherQuery[]>>inject(VacationPlannerComponent).viewState;

	protected readonly range = computed(() => totalRange(this.queries()));

	private readonly params = computed(() => queryToParams(this.queries()), { equal: (a,b) => a.toString() === b.toString() });

	protected readonly weatherData = resource({
		request: () => this.params(),
		loader: async ({ request, abortSignal }) =>
		{
			// return <MeteoWeatherData[][]>(await import('./dummy.json')).default;
			const urls = request.map(v =>
			{
				const url = new URL(openMeteo);
				url.search = v.toString();
				return url;
			});	
			
			const result = await Promise.all(urls.map(async (url) =>
			{
				const response = await fetch(url, { signal: abortSignal });
				return response.json();
			}));
			return result;
		}
	});

	protected readonly data = computed(() =>
	{
		const raw = this.weatherData.value();
		if (raw == null)
			return null;
		
		return parseResponse(this.queries(), raw);
	});
}

function queryToParams(query: WeatherQuery[]): URLSearchParams[]
{
	let { start, end } = totalRange(query);

	const common = {
		latitude: query.map(q => q.location.latitude.toFixed(4)).join(','),
		longitude: query.map(q => q.location.longitude.toFixed(4)).join(','),
		hourly: ["temperature_2m", "precipitation", "cloud_cover", "sunshine_duration", "is_day"].join(','),
		format: 'json'
	};

	const year = Temporal.Now.plainDateISO().year;

	start = start.with({ year }, { overflow: 'constrain' });
	end = end.with({ year }, { overflow: 'constrain' });

	return Array.from({ length: 5}, (_, i) => new URLSearchParams({
		...common,
		start_date: start.subtract({ years: i + 1 }).toString(),
		end_date: end.subtract({ years: i + 1 }).toString(),
	}));
}

function totalRange(query: WeatherQuery[]): DateRange
{
	let start = query[0].dates.start;
	let end = query[0].dates.end;
	
	for (const q of query)
	{
		if (Temporal.PlainDate.compare(start, q.dates.start) > 0)
			start = q.dates.start;

		if (Temporal.PlainDate.compare(end, q.dates.end) < 0)
			end = q.dates.end;
	}

	return { start, end };
}


