// import, set API key
mapboxgl.accessToken = "MAPBOX_API_KEY_PLACEHOLDER";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-84.39, 33.75],
  zoom: 10,
});

// Load and display projects
fetch("data/projects.geojson")
  .then((response) => response.json())
  .then((data) => {
    map.on("load", () => {
      map.addSource("projects", {
        type: "geojson",
        data: data,
      });

      map.addLayer({
        id: "projects-layer",
        type: "circle",
        source: "projects",
        paint: {
          "circle-radius": 6,
          "circle-color": "#007cbf",
        },
      });

      populateTable(data.features);
    });
  })
  .catch((error) => console.error("Error loading data:", error));

// Populate table
function populateTable(features) {
  const tbody = document
    .getElementById("projects-table")
    .getElementsByTagName("tbody")[0];
  tbody.innerHTML = ""; // Clear table first

  features.forEach((feature) => {
    const row = tbody.insertRow();
    row.insertCell(0).innerText = feature.properties.SHORT_DESC || "N/A";
    row.insertCell(1).innerText = feature.properties.COUNTY || "N/A";
    row.insertCell(2).innerText = feature.properties.REC_STATUS || "N/A";
  });
}
