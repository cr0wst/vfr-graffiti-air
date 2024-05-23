<script lang="ts">
	import Map from '$lib/map/Map.svelte';
	import { onMount } from 'svelte';
	import { activePilot, controllers, pilots, showAllPilots } from '$lib/stores';
	import LayerToggle from '$lib/LayerToggle.svelte';
	import PilotInfo from '$lib/PilotInfo.svelte';
	import { writable } from 'svelte/store';

	const loading = writable(true);

	onMount(() => {
		loadData();
		const interval = setInterval(() => {
			if ($loading === false){
				loadData();
			}

		}, 30000);

		showAllPilots.subscribe(() => {
			loadData();
		});

		return () => clearInterval(interval);
	});

	async function loadData() {
		try {
			const [pilotResponse, controllerResponse] = await Promise.all([
				fetch(`/api/pilots?showAllPilots=${$showAllPilots}`),
				fetch('/api/controllers'),
			]);

			const [pilotData, controllerData] = await Promise.all([
				pilotResponse.json(),
				controllerResponse.json()
			]);

			pilots.set(pilotData);
			controllers.set(controllerData);
		} finally {
			loading.set(false);
		}
	}
</script>

<div class="absolute bottom-20 md:bottom-10 left-1/2 transform -translate-x-1/2 z-10">
	<LayerToggle/>
</div>

<div class="flex-1 flex w-full z-0 relative" id="content">
	<Map />
</div>

{#if $loading}
	<div class="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
		<p class="text-white mb-4">Fetching initial VATSIM data</p>
		<div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
	</div>
{/if}

{#if $activePilot}
	<div class="absolute left-1/2 transform -translate-x-1/2 z-10 top-1/4 -translate-y-1/4 md:right-10 md:top-1/3 md:-translate-y-1/3 w-10/12">
		<PilotInfo pilot={$activePilot}/>
	</div>
{/if}
