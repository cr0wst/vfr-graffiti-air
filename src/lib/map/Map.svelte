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

					// If there's a plane selected we set the opacity to the departure and arrival artcc to .8 and all others to .2
					// if there's no plane selected but a territory is selected, we also set it to .8 and all others to .2
					// otherwise .6
					const fillOpacity = 0.1;
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
					// Loop through each transceiver and check if it's in the polygon
					controllers.filter(c => c.facility === 6).forEach((controller) => {
						let found = false;
						const t = controller.transceivers[0].transceivers.forEach((t) => {
							if (isTransceiverInPolygon(t, feature.geometry) && !found) {
								found = true;
								layer.setStyle({
									fillOpacity: .5,
									opacity: 1
								});
								const center = [feature.properties.label_lat, feature.properties.label_lon];
								const marker = leaflet.marker(center, {
									icon: L.divIcon({
										iconSize: null,
										className: 'label',
										html: '<div>' + feature.properties.id + '</div>'
									})
								}).addTo(map);

								geoLabels.push(marker);
							}
						});
					});
				}
			})
			.addTo(map);
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
						iconSize: [10, 10],
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

	function isTransceiverInPolygon(transceiver, polygon) {
		const point = turf.point([transceiver.lonDeg, transceiver.latDeg]);
		return turf.booleanPointInPolygon(point, polygon);
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