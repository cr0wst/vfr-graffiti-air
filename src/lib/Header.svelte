<script>
	import PilotSearch from '$lib/PilotSearch.svelte';
	import { showAllPilots } from './stores';

</script>

<nav class="container mx-auto px-6 py-2 w-full absolute top-0 left-0 right-0 z-50">
	<div class="flex flex-grow md:flex-row flex-col md:justify-between md:items-center">
		<div class="flex items-center justify-between md:w-1/2">
			<div class="w-full flex items-center justify-start">
				<a href="/" class="pb-1 text-xl md:text-2xl mr-4">
					<span class="text-white cursive">VATSIM Tracker</span>
				</a>
				<button
					class="px-4 py-1 text-xs rounded-md transition-colors duration-300"
					class:vfr-button={!$showAllPilots}
					class:all-button={$showAllPilots}
					on:click={() => showAllPilots.set(!$showAllPilots)}
				>
					VFR
				</button>
			</div>
		</div>
		<div class="flex-1 md:max-w-lg w-full mt-2 md:mt-0">
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

    .vfr-button {
        @apply text-zinc-100 bg-purple-500 hover:bg-zinc-600;
    }

		.all-button {
			@apply text-zinc-100 bg-zinc-500 hover:bg-zinc-600 bg-opacity-80;
		}
</style>
