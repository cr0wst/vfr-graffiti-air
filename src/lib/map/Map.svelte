<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onDestroy, onMount } from 'svelte';
	import PlaneIcon from '$lib/map/plane.svg?raw';
	import { browser } from '$app/environment';
	import { selectedPilot } from '$lib/stores';
	import * as turf from '@turf/turf';

	export let boundaries: any;
	export let pilots: any[] = [];
	export let controllers: any[] = [];

	let mapElement: any;
	let map: any;
	let leaflet: any;
	let pilotLayer: any;
	let geoJsonLayer: any;
	let geoLabels: any[] = [];
	let controllerLayer: any;

	let centerControllerCenters = controllers.filter((c) => c.facility == 6).map((c) => {
		const transceivers = (c.transceivers || []).map((t) => {
			return turf.point([t.lonDeg, t.latDeg]);
		});
		// Find the centroid of the transceivers turf points
		if (transceivers.length !== 0) {
			return { callsign: c.callsign, center: turf.centroid(turf.featureCollection(transceivers)).geometry };  // Ensure only geometry is returned
		}
	}).filter((c) => c);

	let nonCenterControllerCenters = controllers.filter((c) => c.facility !== 6).map((c) => {
		const transceivers = (c.transceivers || []).map((t) => {
			return turf.point([t.lonDeg, t.latDeg]);
		});
		// Find the centroid of the transceivers turf points
		if (transceivers.length !== 0) {
			return { controller: c, center: turf.centroid(turf.featureCollection(transceivers)).geometry };  // Ensure only geometry is returned
		}
	}).filter((c) => c);

	const controllerGroups = nonCenterControllerCenters.reduce((clusters, current) => {
		// Extract the prefix from the callsign up to the first underscore
		const currentPrefix = current.controller.callsign.split('_')[0];

		// Find a cluster that has a matching prefix
		const foundCluster = clusters.find(cluster =>
			cluster.some(member => {
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
		const preferredCenters = cluster.filter(c => [2, 3, 4].includes(c.controller.facility)); // DEL, GND, TWR
		const appCenters = cluster.filter(c => c.controller.facility === 5); // APP

		let bestCenter;
		if (preferredCenters.length > 0) {
			bestCenter = turf.center(turf.featureCollection(preferredCenters.map(c => turf.point(c.center.coordinates)))).geometry;
		} else if (appCenters.length > 0) {
			bestCenter = turf.center(turf.featureCollection(appCenters.map(c => turf.point(c.center.coordinates)))).geometry;
		} else {
			bestCenter = turf.center(turf.featureCollection(cluster.map(c => turf.point(c.center.coordinates)))).geometry;
		}

		return {
			controllers: cluster.map(c => c.controller),
			center: bestCenter
		};
	});

	console.log(JSON.stringify(controllerGroups.map(cg => cg.controllers.map(c => c.callsign))));

	selectedPilot.subscribe((value) => {
		updateMap();
	});

	onMount(async () => {
		if (browser) {
			leaflet = await import('leaflet');
			await import('leaflet-rotatedmarker');

			map = leaflet.map(mapElement, {
				center: [37.8, -96],
				zoom: 4,
				zoomControl: false
			});

			leaflet
				.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
					minZoom: 0,
					maxZoom: 20,
					attribution:
						'&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
					ext: 'png'
				})
				.addTo(map);

			updateMap();
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
		if (geoJsonLayer) {
			map.removeLayer(geoJsonLayer);
		}

		if (geoLabels) {
			for (let i = 0; i < geoLabels.length; i++) {
				map.removeLayer(geoLabels[i]);
			}
		}

		geoJsonLayer = leaflet
			.geoJson(boundaries, {
				style: (feature) => {
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
				onEachFeature: (feature, layer) => {
					// Determine if a controller is in this boundary
					const controllerInBoundary = centerControllerCenters.find((c) => {
								return turf.booleanPointInPolygon(c.center, feature) === true;
					});
					if (controllerInBoundary) {
						const controller = controllers.find((c) => c.callsign == controllerInBoundary.callsign);
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
`)
							.on('mouseover', function() {
								layer.openPopup();
							})
							.on('mouseout', function() {
								layer.closePopup();
							})

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

	function updateControllerLayer() {
		if (controllerLayer) {
			map.removeLayer(controllerLayer);
		}

		controllerLayer = controllerGroups.flatMap(group => {
			// Create a div to hold all markers in the group, using flexbox for horizontal layout
			const groupHtml = group.controllers.sort((a, b) => a.facility - b.facility).map(controller => `
        <div class="hover:pointer w-3 h-3 flex items-center justify-center text-[.65rem] font-bold rounded-none"
            style="background-color: ${getFacilityColor(controller.facility).bgColor}; color:${getFacilityColor(controller.facility).textColor}">
            ${getFacilityLetter(controller.facility)}
        </div>
    `).join('');

			const popupContent = group.controllers.map(controller => `
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
			`).on('mouseover', function() {
				marker.openPopup();
			}).on('mouseout', function() {
				marker.closePopup();
			}).addTo(map);

			return marker;
		});
	}

	function updatePilotLayer() {
		if (pilotLayer) {
			map.removeLayer(pilotLayer);
		}

		pilotLayer = pilots.map((f) => {
			const color = '#a96aad';

			// add some transparency if the plane is not selected
			const marker = leaflet
				.marker([f.latitude, f.longitude], {
					icon: leaflet.divIcon({
						html: `<div class="plane-icon hover:pointer" style="--fill-color: ${color}">${PlaneIcon}</div>`,
						iconSize: [14, 14],
						iconAnchor: [5, 5],
						className: ''
					}),
					rotationAngle: f.heading,
					rotationOrigin: 'center',
					interactive: true,
					opacity: 1
				}).bindPopup(`
    <div class="flex flex-col justify-center items-center text-xs">
        <h1 class="font-semibold text-purple-400 w-full font-mono">${f.callsign}</h1>
        <div class="mt-1 text-purple-100 w-full font-mono">FL${convertAltitudeToFlightLevel(f.altitude)} ${f.groundspeed}kts</div>
        <div class="mt-1 text-purple-100 w-full font-mono">
            ${
					f.flight_plan && f.flight_plan.departure && f.flight_plan.arrival
						? `${f.flight_plan.departure} - ${f.flight_plan.arrival}`
						: 'No FP'
				}
        </div>
    </div>
`)
				.on('click', () => {
					$selectedPilot = f;
				})
				.on('mouseover', function() {
					marker.openPopup();
				})
				.on('mouseout', function() {
					marker.closePopup();
				})
				.addTo(map);

			return marker;
		});
	}

	function convertAltitudeToFlightLevel(altitude: number) {
		// pad with 0s and make 3 digits 4500 should be 045 40000 should be 40000
		return Math.round(altitude / 100).toString().padStart(3, '0');
	}

	function getFacilityColor(facility) {
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


	function getFacilityLetter(facility) {
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
</script>

<div bind:this={mapElement} id="map"></div>

<style>
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
</style>