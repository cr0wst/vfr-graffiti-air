import type { Airport, Controller, Pilot } from '../types';
import { derived, writable } from 'svelte/store';

import { airports as airportData } from './map/airports';

export const pilots = writable<Pilot[]>([]);

export const controllers = writable<Controller[]>([]);

export const airports = writable<Airport[]>(airportData);

export const boundaries = writable<any>(null);

export const activePilotId = writable<number | null>(null);

export const activePilot = derived([pilots, activePilotId], ([$pilots, $activePilotId]) =>
	$pilots.find((pilot) => pilot.cid === $activePilotId)
);
