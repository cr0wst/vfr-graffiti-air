import type { PageLoad, PageLoadEvent } from './$types';
import { boundaries, controllers, metars, pilots } from '$lib/stores';
import { ui } from '$lib/stores/ui';

let boundariesLoaded = false;

export const load: PageLoad = async ({ fetch, depends }: PageLoadEvent) => {
	depends('app:loadData');
	try {
		// Load boundaries only once
		if (!boundariesLoaded) {
			boundaries.set(await fetchBoundaries(fetch));
			boundariesLoaded = true;
		}
		pilots.set(await fetchPilots(fetch));
		controllers.set(await fetchControllers(fetch));
		metars.set(await fetchMetars(fetch));
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

async function fetchPilots(fetch: typeof window.fetch) {
	let showAllPilots = false;
	let uiStoreUnsubscriber = ui.subscribe((value) => {
		showAllPilots = value.showAllPilots;
	});
	// Unsubscribe to the ui
	uiStoreUnsubscriber();
	return fetch(`/api/pilots?showAllPilots=${showAllPilots}`).then((r) => r.json());
}

async function fetchControllers(fetch: typeof window.fetch) {
	return fetch('/api/controllers').then((r) => r.json());
}

async function fetchMetars(fetch: typeof window.fetch) {
	return fetch('/api/metars').then((r) => r.json());
}
