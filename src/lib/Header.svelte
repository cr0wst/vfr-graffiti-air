<script>
	import PilotSearch from '$lib/PilotSearch.svelte';
	import { showAllPilots } from './stores/ui';

</script>

<nav class="container mx-auto px-6 py-2 w-full absolute top-0 left-0 right-0 z-50">
	<div class="flex flex-grow md:flex-row flex-col md:justify-between md:items-center">
		<div class="flex items-center justify-between md:w-1/2">
			<div class="w-3/4 md:w-1/2 flex md:items-center md:justify-center">
				<a href="/" class="pb-1 md:pb-0 text-2xl md:text-4xl mr-4">
					<span class="text-white cursive">VATSIM Traffic</span>
				</a>
				<div
					class="bg-purple-700 bg-opacity-90 shadow-xl px-4 py-2 rounded-lg flex items-center justify-between text-zinc-500">
					<button class="mx-2 group"
									class:visible-layer-button={!$showAllPilots}
									on:click={() => $showAllPilots = !$showAllPilots}>
            <span class="text-sm font-medium transition-opacity duration-300 group-hover:text-zinc-300"
						>
  VFR
            </span>
					</button>
				</div>
			</div>
		</div>
		<div class="flex-1 md:max-w-lg w-full">
			<PilotSearch />
		</div>
	</div>
</nav>

<style lang="postcss">
    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');

    /* Apply the script font to the first part of the title */
    .cursive {
        font-family: 'Permanent Marker', cursive;
    }

    .visible-layer-button {
        @apply text-zinc-100;
    }
</style>
