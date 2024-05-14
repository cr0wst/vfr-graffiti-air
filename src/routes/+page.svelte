<script lang="ts">
	import Map from '$lib/map/Map.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { activePilot, controllers, pilots } from '$lib/stores';
	import LayerToggle from '$lib/LayerToggle.svelte';
	import PilotInfo from '$lib/PilotInfo.svelte';

	onMount(() => {
		const interval = setInterval(() => {
			invalidate('app:loadData');
		}, 30000);
		return () => clearInterval(interval);
	});
</script>

<div class="absolute bottom-20 md:bottom-10 left-1/2 transform -translate-x-1/2 z-10">
	<LayerToggle/>
</div>


	<div class="flex-1 flex w-full z-0" id="content">
		<Map />
	</div>

{#if $activePilot}
	<div class="absolute left-1/2 transform -translate-x-1/2 z-10 top-1/4 -translate-y-1/4 md:right-10 md:top-1/3 md:-translate-y-1/3 w-10/12">
		<PilotInfo pilot={$activePilot}/>
	</div>
{/if}
<style lang="postcss">

</style>