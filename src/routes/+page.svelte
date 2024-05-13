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

<div class="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
	<LayerToggle/>
</div>


	<div class="flex-1 flex w-full z-0" id="content">
		<Map />
	</div>

{#if $activePilot}
	<div class="absolute right-10 top-1/3 transform -translate-y-1/3 z-10 w-1/3">
		<PilotInfo pilot={$activePilot}/>
	</div>
{/if}
<style lang="postcss">

</style>