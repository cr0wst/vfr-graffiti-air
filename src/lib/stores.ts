import type { Airport, Controller, Metar, Pilot } from '../types';
import { derived, writable } from 'svelte/store';

export const pilots = writable<Pilot[]>([]);

export const showAllPilots = writable<boolean>(false);

export const controllers = writable<Controller[]>([]);

export const metars = writable<Metar[]>([]);

export const boundaries = writable<any>(null);

export const activePilotId = writable<number | null>(null);

export const activePilot = writable(null);

activePilotId.subscribe(async (id) => {
	if (id !== null) {
		try {
			const response = await fetch(`/api/pilots/${id}`);
			if (response.ok) {
				const data = await response.json();
				activePilot.set(data);
			} else {
				activePilot.set(null);
				console.error('Failed to fetch active pilot:', response.statusText);
			}
		} catch (error) {
			activePilot.set(null);
			console.error('Error fetching active pilot:', error);
		}
	} else {
		activePilot.set(null);
	}
});
