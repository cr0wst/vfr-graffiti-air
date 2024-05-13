import type { PageLoad, PageLoadEvent } from './$types';
import { boundaries, controllers, pilots } from '$lib/stores';

export const load: PageLoad = async ({ fetch, depends }: PageLoadEvent) => {
	boundaries.set(await fetchBoundaries(fetch));

	depends('app:loadData');
	pilots.set(await fetchPilots(fetch));
	controllers.set(await fetchControllers(fetch));
};

async function fetchBoundaries(fetch: typeof window.fetch) {
	const boundaries = await fetch('../map/Boundaries.geojson').then((r) => r.json());
	boundaries.features = boundaries.features.filter((feature: any) => {
		return feature.properties.oceanic == '0' && !feature.properties.id.includes('-');
	});
	return boundaries;
}

async function fetchPilots(fetch: typeof window.fetch) {
	return fetch('/api/pilots').then((r) => r.json());
}

async function fetchControllers(fetch: typeof window.fetch) {
	return fetch('/api/controllers').then((r) => r.json());
}
