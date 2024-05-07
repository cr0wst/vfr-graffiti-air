<script lang="ts">
	import Map from '$lib/map/Map.svelte';
	import { selectedPilot } from '$lib/stores';

	export let data;
</script>

<div class="z-0 flex-1 flex w-full" id="content">
	<Map boundaries="{data.boundaries}" pilots="{data.pilots}" controllers="{data.controllers}" />
</div>
<style lang="postcss">

</style>