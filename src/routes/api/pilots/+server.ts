import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ui } from '$lib/stores/ui';

export const GET: RequestHandler = async ({ url, locals }) => {
	const showAllPilots =
		url.searchParams.has('showAllPilots') && url.searchParams.get('showAllPilots') === 'true';

	// Filter VFR pilots by transponder or flight rules
	const query = showAllPilots
		? {}
		: {
				$or: [
					{ transponder: '1200', flight_plan: null },
					{ transponder: '7000', flight_plan: null },
					{ 'flight_plan.flight_rules': 'V' },
					{ 'flight_plan.altitude': { $regex: /VFR/i } },
					{ 'flight_plan.remarks': { $regex: /VFR/i } },
					{ 'flight_plan.route': { $regex: /VFR/i } }
				]
			};

	const pilots = await locals.db
		.collection('pilots')
		.aggregate([
			{
				$match: query
			},
			{
				// Lookup the departure airport
				$lookup: {
					from: 'airports',
					let: { departure: '$flight_plan.departure' },
					pipeline: [
						{
							$match: {
								$expr: {
									$or: [
										{ $eq: ['$icao', '$$departure'] },
										{ $eq: [{ $substr: ['$icao', 1, -1] }, '$$departure'] },
										{ $eq: ['$icao', { $substr: ['$$departure', 1, -1] }] }
									]
								}
							}
						}
					],
					as: 'departure_airport'
				}
			},
			{
				// Lookup the arrival airport
				$lookup: {
					from: 'airports',
					let: { arrival: '$flight_plan.arrival' },
					pipeline: [
						{
							$match: {
								$expr: {
									$or: [
										{ $eq: ['$icao', '$$arrival'] },
										{ $eq: [{ $substr: ['$icao', 1, -1] }, '$$arrival'] },
										{ $eq: ['$icao', { $substr: ['$$arrival', 1, -1] }] }
									]
								}
							}
						}
					],
					as: 'arrival_airport'
				}
			},
			{
				// Unwind the departure_airport array to include the airport details or null
				$unwind: {
					path: '$departure_airport',
					preserveNullAndEmptyArrays: true
				}
			},
			{
				// Unwind the arrival_airport array to include the airport details or null
				$unwind: {
					path: '$arrival_airport',
					preserveNullAndEmptyArrays: true
				}
			}
		])
		.toArray();

	return json(pilots);
};
