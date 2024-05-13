<script>
	import { controllers, pilots } from '$lib/stores';
</script>

<nav class="container mx-auto px-6 py-3 w-full">
	<div class="flex flex-grow justify-between items-center">
		<a href="/" class="text-2xl">
			<span class="font-extralight logo-text text-white text-md">VATSIM VFR Tracker</span>
		</a>
		<div class="flex items-center">
			<div class="mr-4">
                <span class="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded">
                    Controllers: <span id="controller-count">{$controllers.length}</span>
                </span>
			</div>
			<div>
                <span class="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded">
                    Pilots: <span id="pilot-count">{$pilots.length}</span>
                </span>
			</div>
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
