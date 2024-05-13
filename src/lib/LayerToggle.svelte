<script lang="ts">

	// Function to toggle layer visibility
	import { ui } from '$lib/stores.js';
	function toggleLayer(layer: keyof typeof $ui.showLayers) {

		ui.update($ui => {
			$ui.showLayers[layer] = !$ui.showLayers[layer];
			return $ui;
		});
	}
</script>
<div class="bg-zinc-200 px-4 h-8 shadow-sm rounded-lg flex items-center justify-between">
	{#each Object.entries($ui.showLayers) as [layer, visible]}
		<button class="mx-2 group"
						aria-pressed={visible}
						on:click={() => toggleLayer(layer)}>
            <span class="text-xs text-zinc-700 font-medium transition-opacity duration-300 group-hover:text-zinc-900"
									style="opacity: {visible ? '1' : '0.5'};">
                {layer[0].toUpperCase() + layer.slice(1)}
            </span>
		</button>
	{/each}
</div>