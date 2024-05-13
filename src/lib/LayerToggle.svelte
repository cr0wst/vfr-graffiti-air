<script lang="ts">

	// Function to toggle layer visibility
	import {ui} from '$lib/stores/ui';

	function toggleLayer(layer: keyof typeof $ui.showLayers) {

		ui.update($ui => {
			$ui.showLayers[layer] = !$ui.showLayers[layer];
			return $ui;
		});
	}
</script>
<div class="bg-zinc-800 bg-opacity-90 shadow-xl px-4 py-2 rounded-lg flex items-center justify-between text-zinc-500">
	{#each Object.entries($ui.showLayers) as [layer, visible]}
		<button class="mx-2 group"
						aria-pressed={visible}
						on:click={() => toggleLayer(layer)}>
            <span class="text-xs font-medium transition-opacity duration-300 group-hover:text-zinc-300"
						class:visible-layer-button={visible}>
                {layer[0].toUpperCase() + layer.slice(1)}
            </span>
		</button>
	{/each}
</div>

<style lang="postcss">
	.visible-layer-button {
			@apply text-zinc-100;
	}
</style>