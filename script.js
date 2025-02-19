// swap out with pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtN2MwdjdtYjBqeTUycnBwbHI1cWJrZmIifQ.BztD8jx6SLKxOtjK1ae4kg before deployment
mapboxgl.accessToken = "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtN2MwdjdtYjBqeTUycnBwbHI1cWJrZmIifQ.BztD8jx6SLKxOtjK1ae4kg";

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/dark-v11", // style URL
  center: [-84.38, 33.76], // starting position [lng, lat]
  zoom: 6,
  crossOrigin: "anonymous",
});

// Load the GeoJSON file
fetch("data/GDOT_export.geojson")
  .then((response) => response.json())
  .then((data) => {
    // Add the GeoJSON layer to the map
    map.addLayer({
      id: "data-layer",
      type: "line",
      source: {
        type: "geojson",
        data: data,
      },
      paint: {
        "line-color": "#FFFFFF",
        "line-width": 2,
      },
    });
  });
