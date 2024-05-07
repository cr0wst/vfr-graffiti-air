import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const controllers = await locals.db
		.collection('controllers')
		.aggregate([
			{
				$match: {
					facility: { $ne: 0 }
				}
			},
			{
				$lookup: {
					from: 'facilities',
					localField: 'facility',
					foreignField: 'id',
					as: 'facility_details'
				}
			},
			{
				$lookup: {
					from: 'transceivers',
					localField: 'callsign',
					foreignField: 'callsign',
					as: 'transceivers'
				}
			},
			{
				$unwind: {
					path: '$transceivers',
					preserveNullAndEmptyArrays: true // keeps the controller documents without transceivers
				}
			},
			{
				$addFields: {
					// Promote transceiver details to the parent document
					transceivers: '$transceivers.transceivers'
				}
			},
			{
				$addFields: {
					transceivers: {
						$map: {
							input: '$transceivers',
							as: 'transceiver',
							in: {
								frequency: '$$transceiver.frequency',
								latDeg: '$$transceiver.latDeg',
								lonDeg: '$$transceiver.lonDeg'
							}
						}
					}
				}
			},
			{
				$addFields: {
					transceivers: {
						$reduce: {
							input: '$transceivers',
							initialValue: [],
							in: {
								$setUnion: ['$$value', ['$$this']]
							}
						}
					}
				}
			}
		])
		.toArray();

	return json(controllers);
};
