import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, ElementRef, input, viewChild } from '@angular/core';
import { DateRange } from '../../model/range';
import { Temporal } from 'temporal-polyfill';
import { area, axisBottom, axisLeft, brushX, D3BrushEvent, line, scaleLinear, ScaleTime, scaleUtc, select, Selection, zoom } from 'd3';
import { dayNight, locations, RangeData, temperatures } from './locations';
import { WeatherQuery } from '../../model/query';
import { WeatherData } from '../../model/weather-data';

@Component({
	selector: 'app-weather-chart',
	imports: [],
	templateUrl: './weather-chart.component.html',
	styleUrl: './weather-chart.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherChartComponent
{
	private readonly svg = viewChild.required<ElementRef<SVGSVGElement>>('chart');

	public readonly query = input.required<WeatherQuery[]>();
	public readonly range = input.required<DateRange>();
	public readonly data = input.required<WeatherData[]>();

	public readonly showNight = input(false);
	public readonly showMinMax = input(false);
	public readonly width = input(1280);

	protected readonly label = computed(() =>
	{
		let base = 'temperatures during visit';

		if (!this.showNight())
			base = `day time ${base}`;

		return base;
	});

	private readonly dayData = computed(() =>
	{
		return this.data().map(v => ({
			year: v.year,
			hour: v.hour.filter(h => this.showNight() || h.sunshineDuration > 0)
		}));
	});

	private readonly temperatures = computed(() => ({
		min: 0,
		max: 30,
	}));

	private readonly margin = computed(() => ({
		top: 40,
		bottom: 40,
		left: 40,
		right: 40,
	}));

	protected readonly size = computed(() => ({
		width: this.width(),
		height: this.width() * 9 / 16,
	}));

	private bottomAxis!: Selection<SVGGElement, unknown, null, undefined>;

	private readonly clientArea = computed(() =>
	{
		const size = this.size();
		const margin = this.margin();

		const t = margin.top;
		const l = margin.left;
		const b = size.height - margin.bottom;
		const r = size.width - margin.right;

		return {
			left: l,
			top: t,
			right: r,
			bottom: b,
			height: b - t,
			width: r - l,
		};
	});

	private readonly xAxis = computed(() =>
	{
		const length = this.dayData()[0].hour.length;
		const { left, right } = this.clientArea();

		return scaleLinear()
			.range([left, right])
			.domain([ 0, length - 1 ]);
	});

	private readonly temperatureAxis = computed(() =>
	{
		const { min, max } = this.temperatures();
		const { top, bottom } = this.clientArea();

		return scaleLinear()
		.range([top, bottom])
		.domain([max, min]);
	});

	public constructor()
	{
		afterRenderEffect({ write: this.updateChart.bind(this) });
	}

	private updateChart()
	{
		const svg = select(this.svg().nativeElement);
		svg.selectChildren().remove();
		const { top, left, bottom, right, height, width } = this.clientArea();

		const xAxis = this.xAxis();
		const temperatureAxis = this.temperatureAxis();
		const data = this.dayData();

		const swimlane = svg.append("g")
			.attr('class', 'swimlane')
			.selectAll()
			.data(locations(data[0].hour, xAxis));

		swimlane.join('line')
			.attr('x1', d => d.left)
			.attr('x2', d => d.left)
			.attr('y1', top)
			.attr('y2', bottom)
			.attr('stroke', 'var(--mat-sys-on-background)')
			.attr('stroke-dasharray', '1 4');

		swimlane.join('text')
			.attr('x', d => d.middle)
			.attr('y', top)
			.text(d => d.name);

		if (this.showNight())
		{
			const daylightGroup = svg.append("g")
				.attr('class', 'daylight')
				.selectAll()
				.data(dayNight(data[0], xAxis, this.range()));
	
			daylightGroup.join('rect')
				.attr('x', d => d.start)
				.attr('width', d => d.width)
				.attr('y', top)
				.attr('height', height)
				.attr('fill', d => d.color)
				.attr('opacity', 0.08);
		}

		const bottomAxis = axisBottom<number>(xAxis)
			.tickFormat(d => this.dayData()[0].hour[d].time.toPlainMonthDay().toString());

		this.bottomAxis = svg.append("g")
		.attr("transform", `translate(0, ${temperatureAxis(0)})`)
		.call(bottomAxis);

		svg.append("g")
		.attr("transform", `translate(${left},0)`)
		.call(axisLeft(temperatureAxis));

		svg.append('text')
			.attr('x', 0)
			.attr('y', 25)
			.attr('text-anchor', 'start')
			.style('font-size', '0.75em')
			.text('Temperature in °C');




		const temperature = temperatures(data);
		const temp = svg.append('g')
			.attr('class', 'temperature');

	
		const tempLine = line<RangeData>()
			.x((_, i) => xAxis(i))
			.y(d => temperatureAxis(d.avg));

		temp.append('path')
			.attr('d', tempLine(temperature))
			.attr('stroke', 'var(--mat-sys-on-background)')
			.attr('fill', 'none');
		

		if (this.showMinMax())
		{
			const tempArea = area<RangeData>()
			.x0((_, i) => xAxis(i))
			.x1((_, i) => xAxis(i))
			.y0(d => temperatureAxis(d.min))
			.y1(d => temperatureAxis(d.max));


			temp.append('path')
				.attr('d', tempArea(temperature))
				.attr('fill', 'var(--mat-sys-tertiary)')
				.attr('opacity', 0.08);
		}

		
		// this.enableZoom();
	}

	// private enableZoom()
	// {
	// 	const { top, left, bottom, right, } = this.clientArea();
	// 	const brush = brushX()
	// 		.extent([[left, top], [right, bottom]])
	// 		.on('end', this.updateZoom.bind(this));
			
	// 	const svg = select(this.svg().nativeElement)
	// 		.append('g')
	// 		.call(brush);
	// }

	// private updateZoom(args: D3BrushEvent<unknown>)
	// {
	// 	const xAxis = this.xAxis();
	// 	console.log(args);
	// 	this.bottomAxis
	// 		.transition()
	// 		.duration(500);
	// }
}

