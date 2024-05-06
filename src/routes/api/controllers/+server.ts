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
			}
		])
		.toArray();

	return json(controllers);
};
