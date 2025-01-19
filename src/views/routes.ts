import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./vacation-planner/vacation-planner.component'),
		children: [
			{
				path: '',
				loadComponent: () => import('./map-planner/map-planner.component'),
			},
			{
				path: 'chart',
				loadComponent: () => import('./weather-view/weather-view.component'),
			}
		]
	}
];
