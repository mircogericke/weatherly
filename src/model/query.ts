import { QueryLocation } from "./location";
import { DateRange } from "./range";

export interface WeatherQuery {
	location: QueryLocation;
	dates: DateRange;
}
