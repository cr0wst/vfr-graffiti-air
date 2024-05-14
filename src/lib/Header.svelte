<script>
	import { controllers, pilots } from '$lib/stores';
	import PilotSearch from '$lib/PilotSearch.svelte';
</script>

<nav class="container mx-auto px-6 py-3 w-full">
	<div class="flex flex-grow justify-between items-center">
		<div class="flex items-center">
			<a href="/" class="text-2xl mr-4">
				<span class="font-extralight logo-text text-white text-md">VATSIM VFR Tracker</span>
			</a>
			<div>
                <span class="bg-orange-300 text-orange-900 text-sm font-semibold px-4 py-2 rounded">
                    Controllers: <span id="controller-count">{$controllers.length}</span>
                </span>
			</div>
			<div class="ml-4">
                <span class="bg-purple-400 text-purple-900 text-sm font-semibold px-4 py-2 rounded">
                    Pilots: <span id="pilot-count">{$pilots.length}</span>
                </span>
			</div>
		</div>
		<div class="flex-1 max-w-lg">
			<PilotSearch/>
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
        font-size: 1.5rem; /* Adjust size as necessary */
        font-weight: 700; /* Ensures the font is bold enough */
    }
</style>
