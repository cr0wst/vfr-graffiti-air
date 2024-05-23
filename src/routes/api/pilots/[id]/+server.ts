import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ui } from '$lib/stores/ui';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;

	const pilot = await locals.db
		.collection('pilots')
		.aggregate([
			{
				$match: { cid: parseInt(id, 10) }
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
		.next();

	return json(pilot);
};
