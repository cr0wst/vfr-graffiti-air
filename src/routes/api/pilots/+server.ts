import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Filter VFR pilots by transponder or flight rules
	const query = {
		$or: [
			{ transponder: '1200', flight_plan: null },
			{ transponder: '7000', flight_plan: null },
			{ 'flight_plan.flight_rules': 'V' },
			{ altitude: /^VFR\/\d+/i },
			{
				$or: [
					{ 'flight_plan.remarks': { $regex: /VFR/i } },
					{ 'flight_plan.route': { $regex: /VFR/i } }
				]
			},
			{
				$and: [
					// Adding this to explicitly handle cases where flight rules might indicate VFR-like conditions
					{ 'flight_plan.flight_rules': { $ne: 'I' } }, // Exclude standard IFR unless specified otherwise
					{
						$or: [
							{
								'flight_plan.remarks': {
									$regex: /(FF|flight following)(?!.*no (FF|flight following))/i
								}
							},
							{
								'flight_plan.route': {
									$regex: /(FF|flight following)(?!.*no (FF|flight following))/i
								}
							}
						]
					}
				]
			}
		]
	};

	const pilots = await locals.db.collection('pilots').find(query).toArray();

	return json(pilots);
};
