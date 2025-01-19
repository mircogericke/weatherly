import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EditableQuery } from '../../model/editable-query';
import { Intl, toTemporalInstant } from 'temporal-polyfill';

@Component({
	selector: 'app-map-tooltip',
	imports: [],
	templateUrl: './map-tooltip.component.html',
	styleUrl: './map-tooltip.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapTooltipComponent
{
	public readonly query = input.required<EditableQuery>();

	private readonly format = new Intl.DateTimeFormat();

	protected readonly dateRange = computed(() => 
	{
		const start = this.query().start();
		const end = this.query().end();

		if (start != null && end != null)
			return this.format.formatRange(start, end);
		
		if (start != null)
			return 'Start: ' + this.format.format(start);

		if (end != null)
			return 'End: ' + this.format.format(end);

		return null;
	})
}
