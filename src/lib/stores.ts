import type { Airport, Controller, Metar, Pilot } from '../types';
import { derived, writable } from 'svelte/store';

export const pilots = writable<Pilot[]>([]);

export const controllers = writable<Controller[]>([]);

export const metars = writable<Metar[]>([]);

export const boundaries = writable<any>(null);

export const activePilotId = writable<number | null>(null);

export const activePilot = derived([pilots, activePilotId], ([$pilots, $activePilotId]) =>
	$pilots.find((pilot) => pilot.cid === $activePilotId)
);
