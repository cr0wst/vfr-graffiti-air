<script lang="ts">
	import 'leaflet/dist/leaflet.css';
	import { onDestroy, onMount } from 'svelte';
	import PlaneIcon from '$lib/map/plane.svg?raw';
	import { browser } from '$app/environment';

	export let boundaries: any;
	export let pilots: any[] = [];

	let mapElement: any;
	let map: any;
	let leaflet: any;
	let pilotLayer: any;
	let geoJsonLayer: any;
	let labelLayer: any;

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

		if (labelLayer) {
			map.removeLayer(labelLayer);
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
						opacity: 1,
						color: 'white',
						// set fill opacity to .2 if there's a plane selected
						fillOpacity: fillOpacity
					};
				},
				onEachFeature: (feature, layer) => {
					const center = [feature.properties.label_lat, feature.properties.label_lon]
					leaflet.marker(center, {
						icon: L.divIcon({
							iconSize: null,
							className: "label",
							html: "<div>" + feature.properties.id + "</div>"
						})
					}).addTo(map);
				}
			})
			.addTo(map);
	}

	function updatePilotLayer() {
		if (pilotLayer) {
			map.removeLayer(pilotLayer);
		}

		pilotLayer = pilots.map((f) => {
			const color = '#805694' // dark purple

			// add some transparency if the plane is not selected
			const marker = leaflet
				.marker([f.latitude, f.longitude], {
					icon: leaflet.divIcon({
						html: `<div class="plane-icon" style="--fill-color: ${color}">${PlaneIcon}</div>`,
						iconSize: [10, 10],
						iconAnchor: [5, 5],
						className: ''
					}),
					rotationAngle: f.heading,
					rotationOrigin: 'center',
					interactive: true,
					opacity: 1
				})
				.addTo(map);

			return marker;
		});
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
</style>