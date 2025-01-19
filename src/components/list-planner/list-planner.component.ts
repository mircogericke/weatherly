import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { EditableQuery } from '../../model/editable-query';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
	selector: 'app-list-planner',
	imports: [
		MatFormField,
		MatLabel,
		MatInput,
		MatSuffix,
		MatIconButton,
		MatIcon,
		FormsModule,
		MatDatepickerModule,
	],
	templateUrl: './list-planner.component.html',
	styleUrl: './list-planner.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPlannerComponent
{
	public readonly state = model.required<EditableQuery[]>();

	public remove(index: number)
	{
		const state = this.state();
		state.splice(index, 1);
		this.state.set([...state]);
	}
}
