import type { Pilot } from '../types';
import { writable } from 'svelte/store';

export const pilots = writable<Pilot[]>([]);
