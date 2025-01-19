import { SerializedQueryData } from "../../model/editable-query";

function create(name: string, lat: number, lon: number, start: string, end: string): SerializedQueryData
{
	return {
		name: '',
		latitude: lat,
		longitude: lon,
		start: start,
		end: end,
		geocode: name,
	};
}

export const testData = [
	create('Tokyo', 35.669786, 139.791483, '2025-03-31', '2025-04-02'),
	create('Nagasaki', 32.750465, 129.873941, '2025-04-03', '2025-04-05'),
	create('Fukuoka', 33.591326, 130.411830, '2025-04-06', '2025-04-08'),
	create('Hiroshima', 34.394495, 132.470114, '2025-04-09', '2025-04-10'),
	create('Kyoto', 34.959603, 135.740668, '2025-04-11', '2025-04-13'),
	create('Hakone', 35.249856, 139.047599, '2025-04-14', '2025-04-15'),
	create('Kamakura', 35.315282, 139.547820, '2025-04-16', '2025-04-17'),
	create('Tokyo', 35.669786, 139.791483, '2025-04-18', '2025-04-19'),
];
