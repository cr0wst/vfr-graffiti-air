<script>
	import { controllers, pilots } from '$lib/stores';
	import PilotSearch from '$lib/PilotSearch.svelte';
</script>

<nav class="container mx-auto px-6 py-3 w-full">
	<div class="flex flex-grow md:flex-row flex-col md:justify-between md:items-center">
		<div class="flex items-center justify-between my-2 md:w-1/2">
			<div class="w-3/4 md:w-1/2">
			<a href="/" class="text-lg md:text-2xl mr-4">
				<span class="font-extralight logo-text text-white text-md">VATSIM VFR Tracker</span>
			</a>
			</div>
			<div class="flex space-x-2 justify-end flex-grow md:w-1/2">
				<div
					class="bg-orange-400 text-orange-900 text-xs md:text-sm font-semibold p-1 md:w-full md:px-4 md:py-2 rounded">
					<span class="hidden md:inline">Controllers: </span> {$controllers.length}
				</div>
				<div
					class="bg-purple-400 text-purple-900 text-xs md:text-sm font-semibold p-1 md:px-4 md:w-full md:py-2 rounded">
					<span class="hidden md:inline">Pilots: </span> {$pilots.length}
				</div>
			</div>
		</div>
		<div class="flex-1 md:max-w-lg w-full">
			<PilotSearch />
		</div>
	</div>
</nav>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');

    .logo-text {
        background: linear-gradient(
                240deg,
                rgb(48, 181, 64) 20%,
                rgb(214, 0, 14) 30%,
                rgb(133, 2, 221) 50%,
                rgb(48, 199, 255) 60%
        );
        -webkit-background-clip: text;
        color: transparent;
    }

    /* Apply the script font to the first part of the title */
    .text-md {
        font-family: 'Permanent Marker', cursive;
    }
</style>
