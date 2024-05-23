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
			}
		])
		.toArray();

	return json(pilots);
};
