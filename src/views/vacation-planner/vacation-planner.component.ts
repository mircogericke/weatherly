import { ChangeDetectionStrategy, Component, effect, inject, Injector, model, ModelSignal, signal, WritableSignal } from '@angular/core';
import { WeatherQuery } from '../../model/query';
import { testData } from './test-data';
import { ListPlannerComponent } from "../../components/list-planner/list-planner.component";
import { EditableQuery, SerializedQueryData } from '../../model/editable-query';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';
@Component({
	selector: 'app-vacation-planner',
	imports: [
		MatButtonToggleModule,
		MatIcon,
		// WeatherViewComponent,
		ListPlannerComponent,
		RouterOutlet,
],
	templateUrl: './vacation-planner.component.html',
	styleUrl: './vacation-planner.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class VacationPlannerComponent
{
	private readonly injector = inject(Injector);
	private readonly router = inject(Router);

	protected readonly view = signal(this.router.url);

	public readonly editState: WritableSignal<EditableQuery[]>;

	public readonly viewState = model<WeatherQuery[] | null>(null);

	public constructor()
	{
		const loaded = localStorage.getItem('editState');
		const parsed = loaded ? <SerializedQueryData[]>JSON.parse(loaded) : [];
		this.editState = signal<EditableQuery[]>(parsed.map(v => EditableQuery.create({...v, injector: this.injector})));

		(<any>globalThis).loadDemo = () => this.editState.set(testData.map(v => EditableQuery.create({
			...v,
			injector: this.injector,
		})));

		effect(() =>
		{
			const ser = this.editState().map(v => v.serialize());
			localStorage.setItem('editState', JSON.stringify(ser));
		});

		effect(() =>
		{
			const views = this.editState().map(toView);
			if (views.every(v => v != null) && views.length > 0)
				this.viewState.set(views);
			else
				this.viewState.set(null);
		});
	}

	protected navigate(url: string)
	{
		this.router.navigateByUrl(url);
	}
}

function toView(edit: EditableQuery): WeatherQuery | null
{
	const start = edit.start();
	const end = edit.end();

	if (start == null || end == null)
		return null;

	return {
		location: {
			name: edit.displayName(),
			latitude: edit.latitude(),
			longitude: edit.longitude(),
		},
		dates: {
			start: start,
			end: end,
		}
	};
}
