import { computed, Injector, resource, ResourceRef, signal, Signal, WritableSignal } from "@angular/core";
import { Temporal } from "temporal-polyfill";
import { ConvertedSignal, convertedSignal } from "./converted-signal";
import { toTemporalInstant } from 'temporal-polyfill';

const geocodeServer = 'https://nominatim.openstreetmap.org/reverse';

let nextId = 0;

export class EditableQuery
{
	public readonly id = nextId++;

	public readonly name: WritableSignal<string>;
	public readonly latitude: WritableSignal<number>;
	public readonly longitude: WritableSignal<number>;
	public readonly start: WritableSignal<Temporal.PlainDate | null>;
	public readonly end: WritableSignal<Temporal.PlainDate | null>;
	public readonly geocode: Signal<string>;

	public readonly displayName = computed(() => this.name() || this.geocode());
	public readonly startDate: ConvertedSignal<Date | null>;
	public readonly endDate: ConvertedSignal<Date | null>;

	private readonly geocodeResource: ResourceRef<string>;

	public static create(data: EditableQueryData): EditableQuery
	{
		return new EditableQuery(data);
	}

	private constructor(data: EditableQueryData)
	{
		this.name = signal(data.name);
		this.latitude = signal(data.latitude);
		this.longitude = signal(data.longitude);
		this.start = signal(data.start == null ? null : Temporal.PlainDate.from(data.start));
		this.end = signal(data.end == null ? null : Temporal.PlainDate.from(data.end));
		this.startDate = convertedSignal(this.start, toDate, fromDate);
		this.endDate = convertedSignal(this.end, toDate, fromDate);

		const codeRequest = computed(() => <const>[...this.latLong, this.name()], { equal: shouldGeoCode });

		let initial = data.geocode;

		this.geocodeResource = resource({
			request: codeRequest,
			loader: async ({ request, abortSignal }) =>
			{
				if (initial)
				{
					const result = initial;
					initial = null;
					return result;
				}

				if (request[2])
					return '';

				return getGeocodeName(request[0], request[1], abortSignal);
			},
			injector: data.injector,
		});

		this.geocode = computed(() => this.geocodeResource.value() || `${this.latitude()}, ${this.longitude()}`);
	}

	public get latLong(): [number, number]
	{
		return [ this.latitude(), this.longitude() ]
	}

	public destroy()
	{
		this.geocodeResource.destroy();
	}

	public serialize(): SerializedQueryData
	{
		return {
			name: this.name(),
			latitude: this.latitude(),
			longitude: this.longitude(),
			start: this.start()?.toJSON() ?? null,
			end: this.end()?.toJSON() ?? null,
			geocode: this.geocode(),
		};
	}
}

export interface SerializedQueryData {
	name: string;
	latitude: number;
	longitude: number;
	start: string | null;
	end: string | null,
	geocode: string;
}

export interface EditableQueryData {
	injector: Injector;
	name: string;
	latitude: number;
	longitude: number;
	start: Temporal.PlainDate | string | null;
	end: Temporal.PlainDate | string | null,
	geocode: string | null;
}

async function getGeocodeName(latitude : number, longitude: number, signal?: AbortSignal): Promise<string>
{
	const url = new URL(geocodeServer);
	url.searchParams.set('format', 'json');
	url.searchParams.set('lat', latitude.toString());
	url.searchParams.set('lon', longitude.toString());
	url.searchParams.set('zoom', '12');
	url.searchParams.set('layer', 'address');
	url.searchParams.set('email', 'weatherly@mircogericke.com');

	const response = await fetch(url, { signal });
	const json = await response.json();
	return json.address?.city || json.name;
}

function shouldGeoCode([pLat, pLon]: readonly [number, number, string], [cLat, cLon, name]: readonly [number, number, string])
{
	if (name)
		return true;

	if (Math.abs(pLat - cLat) > 0.01)
		return false;

	if (Math.abs(pLon - cLon) > 0.01)
		return false;

	return true;
}


function toDate(value: Temporal.PlainDate | null): Date | null
{
	if (value == null)
		return value;
	return new Date(value.toZonedDateTime(Temporal.Now.timeZoneId()).epochMilliseconds);
}

function fromDate(value: Date | null): Temporal.PlainDate | null
{
	if (value == null)
		return null;

	return toTemporalInstant.call(value)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toPlainDate();
}
