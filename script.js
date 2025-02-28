// swap out with MAPBOX_API_KEY_PLACEHOLDER before deployment
mapboxgl.accessToken = "MAPBOX_API_KEY_PLACEHOLDER";

// instantiate map
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/dark-v11",
  center: [-84.49945496118643, 33.906502431340805],
  zoom: 8.5,
  minZoom: 8,
  crossOrigin: "anonymous",
});

// add dynamic scale to map
const scale = new mapboxgl.ScaleControl({
  maxWidth: 175,
  unit: "imperial",
});
map.addControl(scale);

let hoveredFeatureId = null;
let hoveredProjectId = null;
let projectInfo = [];

// Load the projects, create the filter and table
fetch("data/GDOT_export.geojson")
  .then((response) => response.json())
  .then((data) => {
    // Add unique IDs to features
    data.features.forEach((feature, index) => {
      feature.properties.internalId = index; // Add internalId
    });

    // Add the GeoJSON layer to the map
    map.addLayer({
      id: "pc-projects",
      type: "line",
      source: {
        type: "geojson",
        data: data,
      },
      paint: {
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "#FF0000", // Change to red on hover
          "#0096FF", // Default color
        ],
        "line-width": 8,
        "line-opacity": 0.8,
      },
    });

    // Mouse move event to change color on hover
    map.on("mousemove", "pc-projects", (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const featureId = feature.properties.feature_id;
        const featureIndex = feature.properties.internalId; // Use internalId
        console.log("hovering over: ", featureId, " index: ", featureIndex);

        if (hoveredFeatureId !== null && hoveredFeatureId !== featureIndex) {
          map.setFeatureState(
            { source: "pc-projects", id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = featureIndex;
        map.setFeatureState(
          { source: "pc-projects", id: hoveredFeatureId },
          { hover: true }
        );
      }

      // Mouse leave event to reset color
      map.on("mouseleave", "pc-projects", () => {
        if (hoveredFeatureId !== null) {
          map.setFeatureState(
            { source: "pc-projects", id: hoveredFeatureId },
            { hover: false }
          );
        }
        hoveredFeatureId = null;
      });
    });

    // create an array of project info
    projectInfo = data.features.map((feature) => {
      return {
        description: feature.properties.Project_description,
        url: feature.properties.Project_URL,
        featureId: feature.properties.feature_id,
      };
    });

    const popup = new mapboxgl.Popup({ closeButton: false });

    // function to filter and update the table
    const updateTable = (filterQuery) => {
      const filteredProjects = projectInfo.filter((project) => {
        return project.description
          .toLowerCase()
          .includes(filterQuery.toLowerCase());
      });

      const listingEl = document.getElementById("feature-listing");
      listingEl.innerHTML = "";
      filteredProjects.forEach((project) => {
        const itemLink = document.createElement("a");
        itemLink.textContent = project.description;
        itemLink.href = project.url;
        itemLink.target = "_blank";
        itemLink.className = "project-link";
        itemLink.dataset.featureId = project.featureId;
        listingEl.appendChild(itemLink);
      });

      // add event listener for hovering over any part of the listingEl to simply console.log a message
      listingEl.addEventListener("mouseover", (event) => {
        const featureId = event.target.dataset.featureId;

        if (featureId) {
          console.log("Hovering over feature with featureId:", featureId);
          const features = map.querySourceFeatures("pc-projects", {
            filter: ["==", "feature_id", featureId],
          });
          const feature = features[0];
          const coordinates = feature.geometry.coordinates;
          popup
            .setLngLat(coordinates[0])
            .setHTML(
              `<div style="text-align: center;"><span style="font-family: Arial, sans-serif; font-size: 14px;">${feature.properties.Project_description}</span></div>`
            )
            .addTo(map);
        }
      });

      // Add an event listener to hide the popup when the mouse leaves the listingEl
      listingEl.addEventListener("mouseleave", () => {
        popup.remove(); // Remove the popup
      });

      // Filter the map layer
      const filteredDescriptions = projectInfo
        .filter((project) =>
          project.description.toLowerCase().includes(filterQuery.toLowerCase())
        )
        .map((project) => project.description);

      map.setFilter("pc-projects", [
        "any",
        ...filteredDescriptions.map((description) => [
          "==",
          ["get", "Project_description"],
          description,
        ]),
      ]);
    };

    // Initial update of the table
    updateTable("");

    // Add event listener to the filter input field
    const filterInput = document.getElementById("feature-filter");
    filterInput.addEventListener("input", (e) => {
      const filterQuery = e.target.value;
      updateTable(filterQuery);

      // Show or hide the clear button based on the input value
      const clearButton = filterInput.parentNode.querySelector("span");
      if (filterQuery === "") {
        if (clearButton) {
          clearButton.style.display = "none";
        }
      } else {
        if (!clearButton) {
          const newClearButton = document.createElement("span");
          newClearButton.textContent = "clear";
          newClearButton.style.cursor = "pointer";
          newClearButton.style.marginLeft = "5px";
          newClearButton.style.marginTop = "2px";
          newClearButton.style.fontSize = "13px";
          filterInput.parentNode.appendChild(newClearButton);
          newClearButton.addEventListener("click", () => {
            filterInput.value = "";
            updateTable("");
            newClearButton.style.display = "none";
            map.setFilter("pc-projects", null);
          });
        } else {
          clearButton.style.display = "block";
        }
      }
    });
  });

// Mouse click event to link to project URL
map.on("click", "pc-projects", (e) => {
  if (e.features.length > 0) {
    // Get the clicked feature's properties
    const clickedFeature = e.features[0].properties;

    // Redirect to the project's URL
    const projectUrl = clickedFeature.Project_URL; // Assuming 'Project_URL' is the correct property
    if (projectUrl) {
      window.open(projectUrl, "_blank"); // Navigate to the project URL
    } else {
      console.log("No URL available for this project.");
    }
  }
});

// Add event listener to the map to filter table
map.on("moveend", () => {
  if (projectInfo.length === 0) {
    console.warn(
      "Skipping updateTableFromMapExtent: projectInfo not loaded yet."
    );
    return;
  }

  // Get only the visible features within the map bounds
  const visibleFeatures = map.queryRenderedFeatures(
    [
      [0, 0],
      [map.getCanvas().width, map.getCanvas().height],
    ],
    { layers: ["pc-projects"] }
  );

  // Extract project descriptions of visible features
  const visibleDescriptions = visibleFeatures.map(
    (feature) => feature.properties.Project_description
  );

  // Update the table to only show visible projects
  updateTableFromMapExtent(visibleDescriptions);
});

// Update table based on visible map extent
const updateTableFromMapExtent = (visibleDescriptions) => {
  if (projectInfo.length === 0) return; // Wait for projectInfo to load

  const listingEl = document.getElementById("feature-listing");
  listingEl.innerHTML = "";

  // Ensure the table isn't completely emptied when zooming
  if (visibleDescriptions.length === 0) {
    updateTable(""); // Reset to all projects
    return;
  }

  // Filter projects by both the search query and map extent
  const filteredProjects = projectInfo.filter((project) =>
    visibleDescriptions.some(
      (desc) =>
        desc.trim().toLowerCase() === project.description.trim().toLowerCase()
    )
  );

  // If no projects match, don't clear the entire table
  if (filteredProjects.length === 0) {
    return;
  }

  // Populate the table with filtered projects
  filteredProjects.forEach((project) => {
    const itemLink = document.createElement("a");
    itemLink.textContent = project.description;
    itemLink.href = project.url;
    itemLink.target = "_blank";
    itemLink.className = "project-link";
    itemLink.dataset.featureId = project.featureId;
    listingEl.appendChild(itemLink);
  });
};

// tooltips for the pc-projects
var popup = new mapboxgl.Popup({ closeButton: false });

// change the cursor to a pointer when the mouse is over a feature
map.on("mousemove", "pc-projects", (e) => {
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = "pointer";

  // Populate the popup and set its coordinates based on the feature.
  const feature = e.features[0];
  popup
    .setLngLat(e.lngLat)
    .setHTML(
      `<div style="text-align: center;"><span style="font-family: Arial, sans-serif; font-size: 14px;">${feature.properties.Project_description}</span></div>`
    )
    .addTo(map);

  // Reset the previously hovered feature
  if (hoveredFeatureId !== null) {
    map.setFeatureState(
      { source: "pc-projects", id: hoveredFeatureId },
      { hover: false }
    );
  }

  // Set new hovered feature
  hoveredFeatureId = feature.properties.feature_id;
  map.setFeatureState(
    { source: "pc-projects", id: hoveredFeatureId },
    { hover: true }
  );
});

// remove the tooltip when not hovering
map.on("mouseleave", "pc-projects", () => {
  map.getCanvas().style.cursor = "";
  popup.remove();

  // Reset the hover state when the mouse leaves
  if (hoveredFeatureId !== null) {
    map.setFeatureState(
      { source: "pc-projects", id: hoveredFeatureId },
      { hover: false }
    );
    hoveredFeatureId = null;
  }
});

// geocoder instantiation
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false, // disable the default marker
  placeholder: "Search address:",
  bbox: [-85.046, 33.025, -83.143, 34.982],
  limit: 3,
});

// this will add a red dot to the map at the location of the results
geocoder.on("result", (result) => {
  const coordinates = result.result.geometry.coordinates;
  map.addLayer({
    id: "custom-marker",
    type: "circle",
    source: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinates,
            },
            properties: {},
          },
        ],
      },
    },
    paint: {
      "circle-color": "#ff0000", // red color
      "circle-radius": 10,
    },
  });
});

// remove the marker when the search is cleared
geocoder.on("clear", () => {
  map.removeLayer("custom-marker");
});

// add the geocoder to the map
map.addControl(geocoder);

// load the Counties
fetch("data/ATL_counties.geojson")
  .then((response) => response.json())
  .then((data) => {
    // Add the fill layer of the counties
    map.addLayer({
      id: "atl-counties",
      type: "fill",
      source: {
        type: "geojson",
        data: data,
      },
      paint: {
        "fill-color": "#FFFFFF",
        "fill-opacity": 0,
      },
    });

    // Add the outline (stroke) layer for counties
    map.addLayer({
      id: "ga-counties-outline",
      type: "line",
      source: {
        type: "geojson",
        data: data,
      },
      paint: {
        "line-color": "#D3D3D3",
        "line-width": 1, // Stroke width in pixels
      },
    });
  });

// load the county labels using fetch
fetch("data/ATL_counties_centroids.geojson")
  .then((response) => response.json())
  .then((data) => {
    map.addLayer({
      id: "county-labels",
      type: "symbol",
      source: {
        type: "geojson",
        data: data,
      },
      minzoom: 9,
      maxzoom: 13,
      layout: {
        "text-field": "{NAME} County",
        "text-size": 16,
        "text-allow-overlap": true,
        "text-font": ["Roboto Bold"],
      },
      paint: {
        "text-color": "#FFFFFF",
        "text-halo-color": "#000000",
        "text-halo-width": 1,
      },
    });
  });

// load & style the text box showing the last updated date
fetch("data/current_date.txt")
  .then((response) => response.text())
  .then((date) => {
    const lastUpdatedText = `Data current as of ${date.trim()}`;
    document.getElementById("last-updated").textContent = lastUpdatedText;
    document.getElementById("last-updated").style.zIndex = 1;
    document.getElementById("last-updated").style.position = "absolute";
    document.getElementById("last-updated").style.bottom = "28px";
    document.getElementById("last-updated").style.right = "10px";
    document.getElementById("last-updated").style.fontSize = "15px";
    document.getElementById("last-updated").style.color = "#fff";
    document.getElementById("last-updated").style.opacity = 0.6;
  });
