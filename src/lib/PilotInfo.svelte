<script lang="ts">
	import type { Pilot } from '../types';
	import PlaneIcon from './map/plane.svg?raw';

	export let pilot: Pilot;

	function displayTime(timestamp: string) {
		// Trim the timestamp to a valid ISO 8601 format that JavaScript can parse
		const formattedTimestamp = timestamp.replace(/(\.\d{3})\d+/, '$1');
		return new Date(formattedTimestamp).toLocaleTimeString();
	};

	function createSkyVectorLink(route: string) {
		return `https://skyvector.com/?chart=304&fpl=${encodeURIComponent(route)}`;
	}
</script>

{#if pilot}
	<div class="pilot-info-container bg-zinc-800 text-purple-200 rounded-lg shadow-lg md:p-4 md:m-4 p-2 md:absolute md:top-0 md:right-0 z-20 w-full md:w-fit">
		<div class="flex items-center md:mb-2">
			<div class="md:w-6 md:h-6 md:mr-2 w-3 h-3 mr-3 svg-icon">
				{@html PlaneIcon} <!-- Raw SVG is injected here -->
			</div>
			<a href="https://stats.vatsim.net/connection/details/{pilot.cid}/{pilot.callsign}" target="_blank" class="text-lg md:text-xl font-bold text-purple-300">
				{pilot.callsign}
			</a>
		</div>
		<p class="text-purple-200 text-xs md:text-sm">{pilot.name}</p>
		<div class="grid grid-cols-2 md:gap-2 gap-1 text-sm border-t border-purple-300 md:pt-2 pt-1">
			<div class="border-b border-purple-300 pb-1 hidden md:block md:pb-2">
				<strong>Server:</strong> <span class="text-purple-100">{pilot.server}</span>
			</div>
			<div class="border-b border-purple-300 pb-1 md:pb-2 hidden md:block">
				<strong>Logon Time:</strong> <span class="text-purple-100">{displayTime(pilot.logon_time)}</span>
			</div>
			<div>
				<strong>Latitude:</strong> <span class="text-purple-100">{pilot.latitude.toFixed(3)}</span>
			</div>
			<div>
				<strong>Longitude:</strong> <span class="text-purple-100">{pilot.longitude.toFixed(3)}</span>
			</div>
			<div>
				<strong>Altitude:</strong> <span class="text-purple-100">{pilot.altitude} ft</span>
			</div>
			<div>
				<strong>Groundspeed:</strong> <span class="text-purple-100">{pilot.groundspeed} kts</span>
			</div>
			<div>
				<strong>Heading:</strong> <span class="text-purple-100">{pilot.heading}°</span>
			</div>
			<div>
				<strong>Transponder:</strong> <span class="text-purple-100">{pilot.transponder}</span>
			</div>
			<div class="col-span-2 border-t border-purple-300 hidden md:block pt-2">
				<strong>Flight Plan:</strong> <span class="text-purple-100">{pilot.flight_plan ? 'Yes' : 'No'}</span>
				{#if pilot.flight_plan}
					<div>
						<strong>Route:</strong> <a href={createSkyVectorLink(pilot.flight_plan.route)} target="_blank" class="text-purple-100 hover:text-purple-300">{pilot.flight_plan.route}</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
