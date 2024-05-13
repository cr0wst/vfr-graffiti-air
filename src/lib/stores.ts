import type { Airport, Controller, Pilot } from '../types';
import { derived, writable } from 'svelte/store';

import { airports as airportData } from './map/airports';

export const pilots = writable<Pilot[]>([]);

export const controllers = writable<Controller[]>([]);

export const airports = writable<Airport[]>(airportData);

export const boundaries = writable<any>(null);

export const activePilot = writable<Pilot | null>(null);
