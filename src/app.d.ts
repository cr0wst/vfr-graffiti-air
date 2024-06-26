// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import { Db } from 'mongodb';

declare global {
	namespace App {
		interface Locals {
			db: Db;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
