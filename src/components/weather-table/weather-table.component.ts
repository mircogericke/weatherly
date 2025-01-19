import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-weather-table',
  imports: [],
  templateUrl: './weather-table.component.html',
  styleUrl: './weather-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherTableComponent { }
