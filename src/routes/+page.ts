import type { PageLoad, PageLoadEvent } from './$types';
import { pilots } from '$lib/store';

export const load: PageLoad = async ({ fetch, depends }: PageLoadEvent) => {
	depends('app:loadData');

	pilots.set(await fetchPilots(fetch));
	return {
		boundaries: await fetchBoundaries(fetch),
		controllers: await fetchControllers(fetch)
	};
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
