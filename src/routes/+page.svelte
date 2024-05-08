<script lang="ts">
	import Map from '$lib/map/Map.svelte';
	import { selectedPilot } from '$lib/stores';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	export let data;

	onMount(() => {
		const interval = setInterval(() => {
			invalidate('app:loadData');
		}, 30000);
		return () => clearInterval(interval);
	});

	$: pilots = data.pilots;
	$: controllers = data.controllers;
</script>
<div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 bg-zinc-800 bg-opacity-90 shadow-xl px-4 py-2 rounded-lg flex items-center justify-center text-zinc-100">
	<div class="text-xs font-semibold">VFR Flights: {pilots.length}</div>
	<div class="mx-3 h-5 border-l border-zinc-600"></div>
	<div class="text-xs font-semibold">Controllers: {controllers.length}</div>
</div>


	<div class="flex-1 flex w-full z-0" id="content">
		<Map boundaries="{data.boundaries}" {pilots} {controllers} />
	</div>
<style lang="postcss">

</style>