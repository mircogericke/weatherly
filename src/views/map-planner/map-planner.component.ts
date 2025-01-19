import { afterNextRender, afterRender, ApplicationRef, ChangeDetectionStrategy, Component, computed, createComponent, effect, ElementRef, EnvironmentInjector, inject, Injector, IterableChangeRecord, IterableDiffers, model, SecurityContext, untracked, ViewEncapsulation } from '@angular/core';

import { map as initializeMap, LayerGroup, layerGroup, LeafletMouseEvent, Map as LeafletMap, Marker, marker, tileLayer, LatLngBounds } from 'leaflet';
import { DomSanitizer } from '@angular/platform-browser';
import { EditableQuery } from '../../model/editable-query';
import { MapTooltipComponent } from '../../components/map-tooltip/map-tooltip.component';
import VacationPlannerComponent from '../vacation-planner/vacation-planner.component';

const state = Symbol('markerState');

@Component({
	selector: 'app-map-planner',
	imports: [],
	templateUrl: './map-planner.component.html',
	styleUrl: './map-planner.component.scss',
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MapPlannerComponent
{
	public readonly state = inject(VacationPlannerComponent).editState;

	private readonly element = inject(ElementRef);
	private readonly injector = inject(Injector);
	private readonly env = inject(EnvironmentInjector);
	private readonly appRef = inject(ApplicationRef);
	private readonly sanitizer = inject(DomSanitizer);

	private readonly markers: ReactiveMarker[] = [];

	private map: LeafletMap = null!;
	private markerLayer: LayerGroup = null!;

	public constructor()
	{
		const differ = inject(IterableDiffers).find([]).create<EditableQuery>((_, v) => v.id);
		this.onQueryIndexChanged = this.onQueryIndexChanged.bind(this);
		effect(() =>
		{
			const state = this.state();
			untracked(() => differ.diff(state)?.forEachOperation(this.onQueryIndexChanged));
		});

		afterNextRender({
			write: () =>
			{

				this.map = initializeMap(this.element.nativeElement, {
					worldCopyJump: true,
				});

				if (this.state().length > 0)
				{
					const bounds = new LatLngBounds(this.state().map(q => q.latLong));
					this.map.fitBounds(bounds, { animate: false });
				}
				else
				{
					this.map.setView([51.505, -0.09], 4);
				}


				this.map.addLayer(tileLayer(
					'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				}));

				this.markerLayer = layerGroup([], {});
				this.map.addLayer(this.markerLayer);

				this.map.on('click', this.onMapClick.bind(this));

				// first effect happened before map initialization, "replay" all missed events
				for (const [index, record] of this.state().entries())
				{
					this.onQueryIndexChanged({
						previousIndex: null,
						currentIndex: index,
						item: record,
						trackById: record.id,
					});
				}
			}
		});

		afterRender({
			write: () => this.map.invalidateSize(),
		});
	}

	private onQueryIndexChanged(record: IterableChangeRecord<EditableQuery>)
	{
		// first effect happens before the map is initialized, skip it and add them later
		if (this.map == null)
			return;

		// created
		if (record.previousIndex == null && record.currentIndex != null)
			this.createMarker(record.item);
		// deleted
		else if (record.currentIndex == null)
			this.removeMarker(record.item);
	}

	private createMarker(query: EditableQuery)
	{
		const safeName = computed(() => this.sanitizer.sanitize(SecurityContext.HTML, query.displayName()) ?? '');
		const mark = <ReactiveMarker>marker(query.latLong, { alt: safeName(), draggable: true });

		const tooltip = createComponent(MapTooltipComponent, { environmentInjector: this.env });
		this.appRef.attachView(tooltip.hostView);
		tooltip.setInput('query', query);

		mark.bindTooltip(tooltip.location.nativeElement);
		this.markerLayer.addLayer(mark);
		this.markers.push(mark);

		const latlongEff = effect(() => mark.setLatLng(query.latLong), { injector: this.injector });
		
		mark[state] = {
			query: query,
			destroy:()  =>
			{
				latlongEff.destroy();
				tooltip.destroy();
			},
		};

		mark.on('moveend', () =>
		{
			const { lat, lng } = mark.getLatLng();
			query.latitude.set(lat);
			query.longitude.set(lng);
		});

		return mark;
	}

	private removeMarker(query: EditableQuery)
	{
		const index = this.markers.findIndex(v => v[state].query === query);
		if (index >= 0)
		{
			const marker = this.markers.splice(index, 1)[0];
			marker[state].destroy();
			marker.remove();
		}
	}

	private onMapClick(e: LeafletMouseEvent)
	{
		const {lat, lng } = e.latlng.wrap();

		const query = EditableQuery.create({
			injector: this.injector,
			latitude: lat,
			longitude: lng,
			start: null,
			end: null,
			name: '',
			geocode: null,
		});

		this.state.update(v => [...v, query]);
	}

	// private onMarkerClick(e: LeafletMouseEvent, marker: Marker)
	// {
	// 	marker.remove();
	// }
}

interface MarkerState {
	query: EditableQuery;
	destroy(): void;
}

type ReactiveMarker<T = any> = Marker<T> & { [state]: MarkerState };
