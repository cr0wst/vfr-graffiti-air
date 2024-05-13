import { writable } from 'svelte/store';

function persist(key: string, value: any) {
	// Create a function to safely use localStorage
	function safeLocalStorage() {
		// Check if we're in the browser
		if (typeof window !== 'undefined') {
			const storedValue = localStorage.getItem(key);
			return storedValue ? JSON.parse(storedValue) : value;
		}
		// Return the default value if not in the browser
		return value;
	}

	const data = safeLocalStorage();
	const store = writable(data);

	if (typeof window !== 'undefined') {
		store.subscribe(($value) => {
			localStorage.setItem(key, JSON.stringify($value));
		});
	}

	return store;
}

export const ui = persist('uiSettings', {
	showLayers: {
		airports: true,
		boundaries: true,
		controllers: true,
		pilots: true
	}
});
