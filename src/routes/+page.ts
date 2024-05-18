import type { PageLoad, PageLoadEvent } from './$types';
import { boundaries } from '$lib/stores';

let boundariesLoaded = false;

export const load: PageLoad = async ({ fetch, depends }: PageLoadEvent) => {
	try {
		// Load boundaries only once
		if (!boundariesLoaded) {
			boundaries.set(await fetchBoundaries(fetch));
			boundariesLoaded = true;
		}
	} catch (err) {
		console.log('Error loading data');
		console.error(err);
	}
};

async function fetchBoundaries(fetch: typeof window.fetch) {
	const boundaries = await fetch('../map/Boundaries.geojson').then((r) => r.json());
	boundaries.features = boundaries.features.filter((feature: any) => {
		return feature.properties.oceanic == '0' && !feature.properties.id.includes('-');
	});
	return boundaries;
}
