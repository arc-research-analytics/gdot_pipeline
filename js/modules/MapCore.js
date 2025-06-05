// Handles core map initialization and basic map controls
mapboxgl.accessToken =
  "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtN2MwdjdtYjBqeTUycnBwbHI1cWJrZmIifQ.BztD8jx6SLKxOtjK1ae4kg";

// Define private variables for the module
let mapInstance = null;

// Constants
const bounds = [
  [-90.46816803404282, 28.138365147624448], // Southwest coordinates
  [-74.77089467122902, 37.588973762609974], // Northeast coordinates
];

export function initializeMap() {
  // Create the map instance
  mapInstance = new mapboxgl.Map({
    container: "map", // container ID
    style: {
      version: 8,
      sources: {
        carto: {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> | <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        },
      },
      glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      layers: [
        {
          id: "carto-layer",
          type: "raster",
          source: "carto",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
    center: [-84.05, 32.84],
    zoom: 6.5,
    minZoom: 3,
    maxZoom: 15,
    crossOrigin: "anonymous",
    maxBounds: bounds,
  });

  // add scale bar
  const scale = new mapboxgl.ScaleControl({
    maxWidth: 175,
    unit: "imperial",
  });
  mapInstance.addControl(scale);

  // add geocoder
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: "Search for an address:",
    bbox: [
      -85.89267692462637, 30.054826521831735, -80.98644957596557,
      35.92237987867771,
    ],
    limit: 5,
  });
  const geocoderContainer = geocoder.onAdd(mapInstance);
  document.getElementById("geocoder-container").appendChild(geocoderContainer);

  // add "Data current as of" text box
  fetch("data/current_date.txt")
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(date => {
      const lastUpdatedText = `Data current as of ${date.trim()}`;
      const lastUpdatedElement = document.getElementById("last-updated");
      if (lastUpdatedElement) {
        lastUpdatedElement.textContent = lastUpdatedText;
      } else {
        console.error("Element with ID 'last-updated' not found.");
      }
    })
    .catch(error => {
      console.error("Error fetching or displaying current date:", error);
      const lastUpdatedElement = document.getElementById("last-updated");
      if (lastUpdatedElement) {
        lastUpdatedElement.textContent = "Date not available";
      }
    });

  // Theme management will be handled by ThemeManager.js

  return mapInstance;
}
