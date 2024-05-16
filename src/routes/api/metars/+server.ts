import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const metars = await locals.db.collection('metars').find().toArray();

	return json(metars);
};
