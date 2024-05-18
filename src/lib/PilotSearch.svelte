<script>
	import { activePilotId, pilots } from './stores';
	import { ui } from './stores/ui';
	import { onMount } from 'svelte'; // Import your pilots store

	let searchTerm = '';
	let showDropdown = false;

	// Reactive statement to filter pilots based on the search term
	$: filteredPilots = $pilots.filter(pilot =>
		pilot.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
		pilot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		pilot.cid.toString().includes(searchTerm)
	);

	// Function to handle pilot selection
	function selectPilot(cid, event) {
		event.stopPropagation();  // Stop the event from propagating to the input's blur event
		$activePilotId = cid;
		$ui.showLayers.pilots = true;  // Show the pilots layer
		showDropdown = false;  // Close dropdown on selection
		searchTerm = '';  // Clear search term upon selection
	}

	// Open dropdown when input is focused and close it on external click
	function handleFocus() {
		showDropdown = true;
	}

	// Close dropdown on external click
	function handleClickOutside(event) {
		if (!event.target.closest('.dropdown-container')) {
			showDropdown = false;
		}
	}

	// Add window event listener for handling outside clicks
	onMount(() => {
		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative dropdown-container">
	<input
		type="text"
		placeholder="Search pilots..."
		class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-zinc-800 text-white"
		bind:value={searchTerm}
		on:focus={handleFocus}
	/>

	{#if showDropdown && filteredPilots.length}
		<div
			class="absolute w-full mt-1 bg-zinc-800 shadow-lg max-h-60 overflow-auto rounded-md border border-purple-300 z-50">
			{#each filteredPilots as pilot}
				<div class="p-4 hover:bg-zinc-700 cursor-pointer border-b border-b-zinc-700"
						 on:click={(event) => selectPilot(pilot.cid, event)}>
					<span class="text-lg font-bold text-purple-300">
						{pilot.callsign}
						{#if pilot.flight_plan} - {pilot.flight_plan.aircraft_faa} {/if}
					</span>
					<p class="text-purple-200 text-sm">{pilot.name} ({pilot.cid})</p>
					{#if pilot.flight_plan}
						<p class="text-purple-100 text-sm">{pilot.flight_plan.departure} → {pilot.flight_plan.arrival}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
    input:focus {
        outline: none;
    }
</style>
