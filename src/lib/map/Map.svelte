<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onDestroy, onMount } from 'svelte';
	import PlaneIcon from '$lib/map/plane.svg?raw';
	import { browser } from '$app/environment';
	import * as turf from '@turf/turf';
	import { activePilot, activePilotId, boundaries, controllers, pilots } from '$lib/stores';
	import { ui } from '$lib/stores/ui';
	import type { Controller } from '../../types';

	/**
	 * Center Controller Centers are the center of the transceivers for each center controller
	 */
let centerControllerCenters: any[] = [];

	/**
	 * Non Center Controller Centers are the center of the transceivers for each controller that is not a center controller
	 */
let nonCenterControllerCenters: any[] = [];

	/**
	 * Controller Groups are groups of controllers that share the same prefix in their callsign
	 */
	let controllerGroups: any[] = [];

	// Mapping Layers
	const mapLayers = {
		airportLayer: [] as any[],
		controllerLayer: [] as any[],
		pilotLayer: [] as any[],
		geoJsonLayer: [] as any[],
		polylineLayer: [] as any[],
	};
	let mapElement: any;
	let map: any;
	let leaflet: any;
	let geoLabels: any[] = [];

	let mapZoomLevel = 3;

	onMount(async () => {
		if (browser) {
			leaflet = await import('leaflet');
			await import('leaflet-rotatedmarker');

			map = leaflet.map(mapElement, {
				center: [0, 0],
				zoom: 3,
				zoomControl: false
			});

			map.on('zoomend', function() {
				mapZoomLevel = map.getZoom();
				updateMap(); // Recreate pilot markers with new icon sizes
			});

			map.on('click', function() {
				$activePilotId = null;
				updateMap();
			});

			leaflet
				.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
					noWrap: true,
					minZoom: 3,
					maxZoom: 20,
					attribution:
						'&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					ext: 'png'
				})
				.addTo(map);

			let bounds = leaflet.latLngBounds(leaflet.latLng(-85.05112878, -180), leaflet.latLng(85.05112878, 180));

			map.setMaxBounds(bounds);

			updateMap();
		}
	});

	pilots.subscribe(() => {
		updateMap();
	});

	controllers.subscribe(() => {
		nonCenterControllerCenters = $controllers.filter((c) => c.facility !== 6).map((c) => {
			const transceivers = (c.transceivers || []).map((t) => {
				return turf.point([t.lonDeg, t.latDeg]);
			});
			// Find the centroid of the transceivers turf points
			if (transceivers.length !== 0) {
				return { controller: c, center: turf.centroid(turf.featureCollection(transceivers)).geometry };  // Ensure only geometry is returned
			}
		}).filter((c) => c);


		controllerGroups = nonCenterControllerCenters.reduce((clusters: any[], current: any) => {
			// Extract the prefix from the callsign up to the first underscore
			const currentPrefix = current.controller.callsign.split('_')[0];

			// Find a cluster that has a matching prefix
			const foundCluster = clusters.find(cluster =>
				cluster.some((member: any) => {
					const memberPrefix = member.controller.callsign.split('_')[0];
					return memberPrefix === currentPrefix;
				})
			);

			if (foundCluster) {
				foundCluster.push(current);
			} else {
				clusters.push([current]);
			}
			return clusters;
		}, []).map(cluster => {
			// Determine the best center point based on facility type priority
			const preferredCenters = cluster.filter((c: any) => [2, 3, 4].includes(c.controller.facility)); // DEL, GND, TWR
			const appCenters = cluster.filter((c: any) => c.controller.facility === 5); // APP

			let bestCenter;
			if (preferredCenters.length > 0) {
				bestCenter = turf.center(turf.featureCollection(preferredCenters.map((c: any) => turf.point(c.center.coordinates)))).geometry;
			} else if (appCenters.length > 0) {
				bestCenter = turf.center(turf.featureCollection(appCenters.map((c: any) => turf.point(c.center.coordinates)))).geometry;
			} else {
				bestCenter = turf.center(turf.featureCollection(cluster.map((c: any) => turf.point(c.center.coordinates)))).geometry;
			}
			return {
				controllers: cluster.map((c: any) => c.controller),
				center: bestCenter,
			};
		});

		centerControllerCenters = $controllers.filter((c) => c.facility == 6).map((c) => {
			const transceivers = (c.transceivers || []).map((t) => {
				return turf.point([t.lonDeg, t.latDeg]);
			});
			// Find the centroid of the transceivers turf points
			if (transceivers.length !== 0) {
				return { controller: c, center: turf.centroid(turf.featureCollection(transceivers)).geometry };  // Ensure only geometry is returned
			}
		}).filter((c) => c);

		updateMap();
	});

	let lastPilotZoomedTo: number|null = null;
	activePilot.subscribe((ap) => {
		if (ap && ap.cid !== lastPilotZoomedTo) {
			lastPilotZoomedTo = ap.cid;
			zoomAndCenterMap(ap.latitude, ap.longitude);
		}
	});

	onDestroy(async () => {
		if (map) {
			map.remove();
		}
	});

	function updateMap() {
		if (leaflet && map) {
			updateControllerLayer();
			updateGeoJsonLayer();
			updatePilotLayer();
		}
	}

	function updateGeoJsonLayer() {
		if (mapLayers.geoJsonLayer) {
			map.removeLayer(mapLayers.geoJsonLayer);
		}

		if (geoLabels) {
			for (let i = 0; i < geoLabels.length; i++) {
				map.removeLayer(geoLabels[i]);
			}
		}
		if ($ui.showLayers.boundaries) {

			mapLayers.geoJsonLayer = leaflet
				.geoJson($boundaries, {
					style: () => {
						const color = '#555555';

						const weight = .5;
						return {
							fillColor: color,
							// set the weight to 3 if the plane is selected and this is a departure or arrival artcc
							weight: weight,
							opacity: 0,
							color: 'white',
							// set fill opacity to .2 if there's a plane selected
							fillOpacity: 0
						};
					},
					onEachFeature: (feature: any, layer: any) => {
						// Determine if a controller is in this boundary
						const controllerInBoundary = centerControllerCenters.find((c) => {
							return turf.booleanPointInPolygon(c.center, feature) === true;
						});
						if (controllerInBoundary) {
							const controller = controllerInBoundary.controller;
							layer.setStyle({
								fillOpacity: 0.2,
								opacity: 1
							});

							layer.bindPopup(`
			    <div class="text-xs p-2 bg-zinc-900 bg-opacity-50 border border-purple-300">
         <div class="flex flex-col space-y-1 py-1 min-w-48 max-w-64">

    <div class="flex items-center space-x-2">
            <div class="text-xs w-1/3 font-semibold text-purple-400">${controller.callsign}</div>
            <div class="text-xs w-2/3 text-purple-100 text-right">${controller.frequency}</div>
        </div>

<div class="w-full text-xs text-purple-100">${controller.name}</div>
        ${controller.text_atis ? `<div class="w-full text-xs text-purple-100">${controller.text_atis.join(' ')}</div>` : ''}
    </div>
    </div>
`, { autoPan: false })
								.on('mouseover', function() {
									layer.openPopup();
								})
								.on('mouseout', function() {
									layer.closePopup();
								});

							const label = leaflet
								.marker(layer.getBounds().getCenter(), {
									icon: leaflet.divIcon({
										html: `<div class="label">${feature.properties.id}</div>`,
										iconSize: [100, 40],
										iconAnchor: [50, 20],
										className: ''
									}),
									interactive: false,
									opacity: 1
								})
								.addTo(map);

							geoLabels.push(label);
						}
					}
				})
				.addTo(map);
		}
	}

	ui.subscribe(() => {
		updateMap();
	});

	function updateControllerLayer() {
		if (mapLayers.controllerLayer) {
			mapLayers.controllerLayer.forEach((cl: any) => map.removeLayer(cl));
		}
		if ($ui.showLayers.controllers) {
			mapLayers.controllerLayer = controllerGroups.flatMap(group => {
				const seenFacilities: number[] = [];
				// Create a div to hold all markers in the group, using flexbox for horizontal layout
				// Only show the unique facilities in the group, sorted by facility level
				const groupHtml = group.controllers.sort((a: Controller, b: Controller) => a.facility - b.facility).map((controller: Controller) => {
					if (!seenFacilities.includes(controller.facility)) {
						seenFacilities.push(controller.facility);
					} else {
						return '';
					}
					return `
        <div class="hover:pointer w-3 h-3 flex items-center justify-center text-[.65rem] font-bold rounded-none"
            style="background-color: ${getFacilityColor(controller.facility).bgColor}; color:${getFacilityColor(controller.facility).textColor}">
            ${getFacilityLetter(controller.facility)}
        </div>
    `}).join('');

				const popupContent = group.controllers.map((controller: Controller) => `
    <div class="flex flex-col space-y-1 py-1 min-w-48 max-w-64">

    <div class="flex items-center space-x-2">
            <div class="text-xs w-1/3 font-semibold" style="color: ${getFacilityColor(controller.facility).bgColor}">${controller.callsign}</div>
            <div class="text-xs w-2/3 text-purple-100 text-right">${controller.frequency}</div>
        </div>

<div class="w-full text-xs text-purple-100">${controller.name}</div>
        ${controller.text_atis ? `<div class="w-full text-xs text-purple-100">${controller.text_atis.join(' ')}</div>` : ''}
    </div>
`).join('');

				// Create a single marker for the whole group, positioned at the group's central coordinate
				const marker = leaflet.marker([group.center.coordinates[1], group.center.coordinates[0]], {
					icon: leaflet.divIcon({
						html: `<div class="flex">${groupHtml}</div>`, // Use Tailwind's flex and negative margin for overlap adjustment
						className: '', // Ensure no extra padding or margins are applied from default Leaflet classes
						iconSize: [null, null] // Disable automatic sizing to allow CSS control
					}),
					interactive: true,
					opacity: 1
				}).bindPopup(`
			    <div class="text-xs p-2 bg-zinc-900 bg-opacity-50 border border-purple-300">
        ${popupContent}
    			</div>
			`, { autoPan: false }).on('mouseover', function() {
					marker.openPopup();
				}).on('mouseout', function() {
					marker.closePopup();
				}).addTo(map);

				return marker;
			});
		}
	}

	function updatePilotLayer() {
		if (mapLayers.pilotLayer) {
			mapLayers.pilotLayer.forEach((pl) => map.removeLayer(pl));
		}

		if (mapLayers.polylineLayer) {
			mapLayers.polylineLayer.forEach((pl) => map.removeLayer(pl));
		}

		if ($ui.showLayers.pilots) {
			const iconSize = calculateIconSize();

			mapLayers.pilotLayer = $pilots.map((f) => {
				const color = ($activePilotId && $activePilotId == f.cid) ? '#b330e5' : '#b575b9';

				// add some transparency if the plane is not selected
				const marker = leaflet
					.marker([f.latitude, f.longitude], {
						icon: leaflet.divIcon({
							html: `<div class="plane-icon hover:pointer ${ $activePilot && $activePilot.cid === f.cid ? 'active' : ''}" style="--fill-color: ${color}">${PlaneIcon}</div>`,
							iconSize: [iconSize, iconSize],
							iconAnchor: [iconSize / 2, iconSize / 2],
							className: ''
						}),
						rotationAngle: f.heading,
						rotationOrigin: 'center',
						interactive: true,
						opacity: 1
					}).bindPopup(`<div class="text-xs p-2 bg-zinc-900 bg-opacity-50 border border-purple-300">
    <div class="flex flex-col space-y-1 py-1 min-w-48 max-w-64">

        <!-- Basic Pilot Information -->
        <div class="flex items-center justify-between">
            <div class="font-semibold text-purple-400">${f.callsign}</div>
            <div class="text-purple-100">${f.altitude} ft</div>
        </div>

        <div class="flex items-center justify-between">
            <div class="text-purple-100">${f.name}</div>
            <div class="text-purple-100">GS: ${f.groundspeed} kts</div>
        </div>

        <!-- Flight Plan Information (only shown if available) -->
        ${f.flight_plan ? `
        <div class="text-purple-100">
            <div class="font-semibold text-purple-400">Flight Plan:</div>
            <div>Aircraft: ${f.flight_plan.aircraft_short}</div>
            <div>Departure: ${f.flight_plan.departure}</div>
            <div>Arrival: ${f.flight_plan.arrival}</div>
        </div>
        ` : ''}

    </div>
</div>

`, { autoPan: false })
					.on('mouseover', function() {
						marker.openPopup();
					})
					.on('mouseout', function() {
						marker.closePopup();
					})
					.on('click', (e: any) => {
						$activePilotId = f.cid;
						zoomAndCenterMap(f.latitude, f.longitude);
						e.originalEvent.preventDefault();
					})
					.addTo(map);

				// If the $activePilot is the same as the current pilot, draw a line between their departure, arrival, and current position
				// in orange to indicate the path. This is only drawn if the pilot has a flight plan.
				if ($activePilot && $activePilot.cid === f.cid && f.flight_plan) {
					// Clear the polyline layer
					const departure = $activePilot.departure_airport;
					const arrival = $activePilot.arrival_airport;

					if (departure && arrival) {
						const line = leaflet.polyline([
							[departure.lat, departure.lon],
							[f.latitude, f.longitude],
							[arrival.lat, arrival.lon]
						], {
							color: '#b330e5',
							weight: 2,
							opacity: 1
						}).addTo(map);
						// Add a purple dot at each end with the airport ICAO code label
						const departureMarker = leaflet
							.marker([departure.lat, departure.lon], {
								icon: leaflet.divIcon({
									html: `<div class="airport-label">${departure.icao}</div>`,
									iconSize: [100, 40],
									iconAnchor: [50, 20],
									className: ''
								}),
								interactive: false,
								opacity: 1
							})
							.addTo(map);
						const arrivalMarker = leaflet
							.marker([arrival.lat, arrival.lon], {
								icon: leaflet.divIcon({
									html: `<div class="airport-label">${arrival.icao}</div>`,
									iconSize: [100, 40],
									iconAnchor: [50, 20],
									className: ''
								}),
								interactive: false,
								opacity: 1
							})
							.addTo(map);

						mapLayers.polylineLayer.push(line, departureMarker, arrivalMarker);

					} else if (departure) {
						const line = leaflet.polyline([
							[departure.lat, departure.lon],
							[f.latitude, f.longitude]
						], {
							color: '#b330e5',
							weight: 2,
							opacity: 1
						}).addTo(map);
						// Add a purple dot at each end with the airport ICAO code label
						const departureMarker = leaflet
							.marker([departure.lat, departure.lon], {
								icon: leaflet.divIcon({
									html: `<div class="airport-label">${departure.icao}</div>`,
									iconSize: [100, 40],
									iconAnchor: [50, 20],
									className: ''
								}),
								interactive: false,
								opacity: 1
							})
							.addTo(map);
						mapLayers.polylineLayer.push(line, departureMarker);
					} else if (arrival) {
						const line = leaflet.polyline([
							[f.latitude, f.longitude],
							[arrival.lat, arrival.lon]
						], {
							color: '#b330e5',
							weight: 2,
							opacity: 1
						}).addTo(map);
						// Add a purple dot at each end with the airport ICAO code label
						const arrivalMarker = leaflet
							.marker([arrival.lat, arrival.lon], {
								icon: leaflet.divIcon({
									html: `<div class="airport-label">${arrival.icao}</div>`,
									iconSize: [100, 40],
									iconAnchor: [50, 20],
									className: ''
								}),
								interactive: false,
								opacity: 1
							})
							.addTo(map);
						mapLayers.polylineLayer.push(line, arrivalMarker);
					}
				}
				return marker;
			});
		}
	}

	function convertAltitudeToFlightLevel(altitude: number) {
		// pad with 0s and make 3 digits 4500 should be 045 40000 should be 40000
		return Math.round(altitude / 100).toString().padStart(3, '0');
	}

	function getFacilityColor(facility: any) {
		let bgColor, textColor;
		switch (facility) {
			case 1: // Flight Service Station
				bgColor = '#2563EB'; // HEX for Tailwind bg-blue-600
				textColor = '#E0F2FE'; // Lighter blue for text
				break;
			case 2: // Clearance Delivery
				bgColor = '#047857'; // HEX for Tailwind bg-green-700
				textColor = '#D1FAE5'; // Lighter green for text
				break;
			case 3: // Ground
				bgColor = '#C084FC'; // HEX for Tailwind bg-purple-400
				textColor = '#FAF5FF'; // Lighter purple for text
				break;
			case 4: // Tower
				bgColor = '#F97316'; // HEX for Tailwind bg-orange-500
				textColor = '#FFEDD5'; // Lighter orange for text
				break;
			case 5: // Approach/Departure
				bgColor = '#DDD6FE'; // HEX for Tailwind bg-purple-200
				textColor = '#6D28D9'; // Darker purple for text
				break;
			default:
				bgColor = '#1F2937'; // HEX for Tailwind bg-gray-800 (Default)
				textColor = '#E2E8F0'; // Light gray for text (Default)
				break;
		}
		return { bgColor, textColor };
	}


	function getFacilityLetter(facility: any) {
		switch (facility) {
			case 0:
				return 'O'; // Observer
			case 1:
				return 'F'; // Flight Service Station
			case 2:
				return 'C'; // Clearance Delivery
			case 3:
				return 'G'; // Ground
			case 4:
				return 'T'; // Tower
			case 5:
				return 'A'; // Approach/Departure
			case 6:
				return 'E'; // Enroute
			default:
				return 'X'; // Default letter if no match found
		}
	}

	/**
	 * Calculate the size of the icon based on the current zoom level
	 */
	function calculateIconSize() {
		const currentSize = 8 + (mapZoomLevel - 3);
		return Math.max(currentSize, 8);
	}

	/**
	 * Function to zoom into and center the map on a pilot's coordinates
	 */
	function zoomAndCenterMap(latitude: number, longitude: number) {
		const newZoomLevel = Math.max(6, map.getZoom()); // Increase current zoom by 2 levels
		map.setView([latitude, longitude], newZoomLevel, {
			animate: true,
			pan: {
				duration: 1.0
			}
		});
		updateMap();
	}

</script>

<div bind:this={mapElement} id="map"></div>

<style lang="postcss">
    #map {
        flex: 1;
    }

    :global(path.leaflet-interactive:focus) {
        outline: none;
    }

    :global(.plane-icon > svg > path) {
        fill: var(--fill-color);
        filter: brightness(2);
    }

    :global(.label) {
        padding: 5px;
        font-size: 12px;
        font-weight: bold;
        color: white;
        opacity: 0.5;
    }

    :global(.leaflet-popup-content-wrapper) {
        padding: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent !important;
    }

    :global(.leaflet-popup-tip-container, .leaflet-popup-close-button) {
        display: none !important;
    }

		:global(.vfr) {
				@apply text-green-500;
		}

		:global(.mvfr) {
				@apply text-blue-500;
		}

		:global(.ifr) {
				@apply text-red-500;
		}

		:global(.lifr) {
				@apply text-purple-500;
		}

		:global(.airport-label) {
				@apply text-purple-300 bg-purple-600 rounded-md w-fit py-0.5 px-2;
		}
</style>