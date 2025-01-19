import { Temporal } from 'temporal-polyfill';

export interface DateRange {
	start: Temporal.PlainDate;
	end: Temporal.PlainDate;
}
