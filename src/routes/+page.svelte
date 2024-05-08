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

<div class="z-0 flex-1 flex w-full" id="content">
	<Map boundaries="{data.boundaries}" {pilots} {controllers} />
</div>
<style lang="postcss">

</style>