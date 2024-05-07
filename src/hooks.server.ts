import type { Handle } from '@sveltejs/kit';
import { MongoClient } from 'mongodb';

import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	const mongoClient = await MongoClient.connect(env.MONGO_URL);

	event.locals.db = mongoClient.db('vatsim-cache');

	const response = await resolve(event);

	await mongoClient.close();

	return response;
};
