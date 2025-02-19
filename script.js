mapboxgl.accessToken = "MAPBOX_API_KEY_PLACEHOLDER";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-84.388, 33.749], // Center the map around Atlanta, GA
  zoom: 6,
});

map.on("load", () => {
  // Load the GeoJSON data
  map.addSource("gdot-projects", {
    type: "geojson",
    data: "data/GDOT_export.geojson", // Path to your GeoJSON file
  });

  // Add a layer to visualize the GDOT project geometries
  map.addLayer({
    id: "gdot-projects-layer",
    type: "line", // Use 'line' for polylines and multi-lines
    source: "gdot-projects",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#FF0000", // Set the color of the lines
      "line-width": 4, // Set the width of the lines
    },
  });
});
