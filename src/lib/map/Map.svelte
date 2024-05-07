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
			updateGeoJsonLayer();
			updatePilotLayer();
			updateControllerLayer();
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
			})
			.addTo(map);
	}

	function updateControllerLayer() {
		if (controllerLayer) {
			map.removeLayer(controllerLayer);
		}

		controllerLayer = controllers.map((c) => {
			return (c.transceivers || []).map((t) => {
				const marker = leaflet
					.marker([t.latDeg, t.lonDeg], {
						icon: leaflet.divIcon({
							html: `<div class="hover:pointer rounded-full w-2 h-2 bg-orange-300"></div>`,
							iconSize: [10, 10],
							iconAnchor: [5, 5],
							className: ''
						}),
						interactive: true,
						opacity: 1
					}).bindPopup(`
    <div class="flex flex-col justify-center items-center text-xs">
        <h1 class="font-semibold text-purple-400 w-full font-mono">${c.callsign}</h1>
				<div class="mt-1 text-purple-100 w-full font-mono">${c.name}</div>
        <div class="mt-1 text-purple-100 w-full font-mono">${(t.frequency / 1000000).toFixed(3)}</div>
        <div class="mt-1 text-purple-100 w-full font-mono">
            ${(c.text_atis) ? c.text_atis.join(' ') : ''}
        </div>
    </div>
`)
					.on('mouseover', function() {
						marker.openPopup();
					})
					.on('mouseout', function() {
						marker.closePopup();
					})
					.addTo(map);

				return marker;
			});
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