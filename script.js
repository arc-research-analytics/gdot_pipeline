// swap out with pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtN2MwdjdtYjBqeTUycnBwbHI1cWJrZmIifQ.BztD8jx6SLKxOtjK1ae4kg before deployment
mapboxgl.accessToken =
  "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtN2MwdjdtYjBqeTUycnBwbHI1cWJrZmIifQ.BztD8jx6SLKxOtjK1ae4kg";

// define map bounds
const bounds = [
  [-90.46816803404282, 28.138365147624448], // Southwest coordinates
  [-74.77089467122902, 37.588973762609974], // Northeast coordinates
];

// -v-v-v-v-v-v-v-v MAPBOX MAP -v-v-v-v-v-v-v-v
const map = new mapboxgl.Map({
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

// add dynamic scale to map
const scale = new mapboxgl.ScaleControl({
  maxWidth: 175,
  unit: "imperial",
});
map.addControl(scale);

let projectInfo = [];
let hoveredProjectId = null;

// Load map and layers
map.on("load", () => {
  Promise.all([
    fetch("data/congressional_districts/cdistricts.geojson").then((response) =>
      response.json()
    ),
    fetch("data/counties/GA_counties_centroids.geojson").then((response) =>
      response.json()
    ),
    fetch("data/congressional_districts/cdistricts_centroids.geojson").then(
      (response) => response.json()
    ),
  ]).then(([cdData, countyData, cdLabelData]) => {
    map.addLayer({
      id: "ga-congressional-districts",
      type: "line",
      source: {
        type: "geojson",
        data: cdData,
      },
      paint: {
        "line-color": "#525252",
        "line-width": 2,
      },
    });

    map.addLayer({
      id: "county-labels",
      type: "symbol",
      source: {
        type: "geojson",
        data: countyData,
      },
      minzoom: 8.5,
      maxzoom: 15,
      layout: {
        "text-field": "{ShortLabel}",
        "text-size": 14,
        "text-allow-overlap": false,
        "text-font": ["Roboto Bold Italic"],
        "text-transform": "uppercase",
      },
      paint: {
        "text-color": "#000000",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": 0.75,
      },
    });

    map.addLayer({
      id: "cd-labels",
      type: "symbol",
      source: {
        type: "geojson",
        data: cdLabelData,
      },
      minzoom: 7.5,
      maxzoom: 15,
      layout: {
        "text-field": "District {DISTRICT}",
        "text-size": 16,
        "text-allow-overlap": true,
        "text-font": ["Roboto Bold"],
      },
      paint: {
        "text-color": "#f0f0f0",
        "text-halo-color": "#000000",
        "text-halo-width": 2,
      },
    });
  });
});

// Load the projects, create the filter and table ---------v-----------
fetch("data/GDOT_export.geojson")
  .then((response) => response.json())
  .then((data) => {
    map.addSource("projects-source", {
      type: "geojson",
      data: data,
    });

    // Add the GeoJSON layer to the map
    map.addLayer({
      id: "all-projects",
      type: "line",
      source: "projects-source",
      paint: {
        "line-color": [
          "match",
          ["get", "CONSTRUCTION_STATUS_DERIVED"],
          "PRE-CONSTRUCTION",
          "#CC5500", // default color for pre-construction
          "UNDER-CONSTRUCTION",
          "#009f00", // default color for under-construction
          "COMPLETED-CONSTRUCTION",
          "#00009f", // default color for completed-construction
          "#888888", // default color
        ],
        // "line-width": 8,
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          11, // width on hover
          5, // default width]
        ],
        "line-opacity": 0.8,
      },
    });

    // create an array of project info
    projectInfo = data.features.map((feature) => {
      return {
        description: feature.properties.Project_description,
        url: feature.properties.Project_URL,
        constructionStatus: feature.properties.CONSTRUCTION_STATUS_DERIVED,
        featureId: feature.id,
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
        const featureId = Number(event.target.dataset.featureId);

        const feature = data.features.find((f) => f.id === featureId);
        if (feature) {
          const coordinates = feature.geometry.coordinates[0];
          popup
            .setLngLat(coordinates)
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

      map.setFilter("all-projects", [
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
  });

// Mouse click event to link to project URL
map.on("click", "all-projects", (e) => {
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

// Common function to filter and update the table based on map extent
const filterAndUpdateTable = () => {
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
    { layers: ["all-projects"] }
  );

  // Extract project descriptions of visible features
  const visibleDescriptions = visibleFeatures.map(
    (feature) => feature.properties.Project_description
  );

  // Update the table to only show visible projects
  updateTableFromMapExtent(visibleDescriptions);
};

// Filter and update table on load after waiting 200 ms
map.on("idle", () => {
  filterAndUpdateTable(); // Filter and update on initial load
});

// Filter and update table when the user moves the map
map.on("moveend", () => {
  filterAndUpdateTable(); // Filter and update on map move
});

// tooltips for the all-projects
var popup = new mapboxgl.Popup({ closeButton: false });

// change the cursor to a pointer when the mouse is over a feature
map.on("mousemove", "all-projects", (e) => {
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

  if (e.features.length > 0) {
    // Reset the previously hovered feature
    if (hoveredProjectId !== null) {
      map.setFeatureState(
        { source: "projects-source", id: hoveredProjectId },
        { hover: false }
      );
    }

    hoveredProjectId = e.features[0].id;
    map.setFeatureState(
      { source: "projects-source", id: hoveredProjectId },
      { hover: true }
    );
  }
});

// remove the tooltip when not hovering
map.on("mouseleave", "all-projects", () => {
  map.getCanvas().style.cursor = "";
  popup.remove();

  // Reset the hover state when the mouse leaves
  if (hoveredProjectId !== null) {
    map.setFeatureState(
      { source: "projects-source", id: hoveredProjectId },
      { hover: false }
    );
    hoveredProjectId = null;
  }
});

// geocoder instantiation
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false, // disable the default marker
  placeholder: "Search for an address:",
  bbox: [
    -85.89267692462637, 30.054826521831735, -80.98644957596557,
    35.92237987867771,
  ],
  limit: 5,
});

// this will add a red dot to the map at the location of the results
geocoder.on("result", (result) => {
  const coordinates = result.result.geometry.coordinates;

  map.addSource("marker", {
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
  });

  // add a symbol layer using
  map.addLayer({
    id: "custom-marker",
    type: "circle",
    source: "marker",
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

// get the geocoder container element
const geocoderContainer = geocoder.onAdd(map);

// append the geocoder container to a separate <div> element
document.getElementById("geocoder-container").appendChild(geocoderContainer);

// "Data current as of" text box
fetch("data/current_date.txt")
  .then((response) => response.text())
  .then((date) => {
    const lastUpdatedText = `Data current as of ${date.trim()}`;
    document.getElementById("last-updated").textContent = lastUpdatedText;
    document.getElementById("last-updated").style.zIndex = 1;
    document.getElementById("last-updated").style.position = "absolute";
    document.getElementById("last-updated").style.bottom = "9px";
    document.getElementById("last-updated").style.left = "100px";
    document.getElementById("last-updated").style.fontSize = "15px";
    document.getElementById("last-updated").style.color = "#525252";
    document.getElementById("last-updated").style.opacity = 0.6;
  });

// modify the filter button based on screen size
function updateButtonText() {
  const button = document.querySelector(".openDrawer");

  if (window.innerWidth <= 768) {
    button.innerHTML = `<span class="material-symbols-outlined">map_search</span>`;
  } else {
    button.innerHTML = `
      Map filters & metrics
      <span class="material-symbols-outlined">map_search</span>
    `;
  }
}

// Run function on page load to change button based on screen size
updateButtonText();

// Listen for window resize events
window.addEventListener("resize", updateButtonText);

// Function to update the map layer based on filters
const updateMapLayer = () => {
  const statusSelect = document.getElementById("statusSelect");
  const districtSelect = document.getElementById("districtSelect");

  if (!statusSelect || !districtSelect) {
    console.error(
      "layerSelect or districtSelect element not found in the DOM."
    );
    return; // Prevent further errors
  }

  const selectedStatus = statusSelect.value;
  const selectedDistrict = parseInt(districtSelect.value, 10);

  if (!map.isStyleLoaded()) {
    setTimeout(() => {
      updateMapLayer();
    }, 100);
    return;
  }

  // Apply the filter to match selected construction statuses and districts
  if (selectedStatus === "ALL") {
    map.setFilter("all-projects", [
      "all",
      ["==", ["get", "DISTRICT"], selectedDistrict],
    ]);
  } else {
    map.setFilter("all-projects", [
      "all",
      [
        "in",
        ["downcase", ["get", "CONSTRUCTION_STATUS_DERIVED"]],
        ["literal", selectedStatus.toLowerCase()],
      ],
      ["==", ["get", "DISTRICT"], selectedDistrict],
    ]);
  }
};

// on load, update the map layer on initial load
map.on("idle", () => {
  updateMapLayer(); // Filter and update on initial load
});

// Function to update summary stats based on dropdown selections
const updateSummaryStats = (summaryData) => {
  const selectedStatus = document.getElementById("statusSelect").value;
  const selectedDistrict = parseInt(
    document.getElementById("districtSelect").value
  );

  // Filter the summaryData based on the selected filters
  const filteredData = summaryData.find(
    (item) =>
      item.CONSTRUCTION_STATUS_DERIVED === selectedStatus &&
      item.DISTRICT === selectedDistrict
  );

  // If no matching data is found, reset to 0
  if (!filteredData) {
    document.getElementById("total-projects").textContent = "0";
    document.getElementById("total-cost").textContent = "$0";
    document.getElementById("average-cost").textContent = "$0";
    return;
  }

  console.log("filteredData", filteredData);

  // Update summary stats in the DOM with the matched data
  document.getElementById("total-projects").textContent =
    filteredData.total_projects.toLocaleString();
  document.getElementById(
    "total-cost"
  ).textContent = `$${filteredData.total_cost.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
  document.getElementById(
    "average-cost"
  ).textContent = `$${filteredData.average_cost.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Function to load the summary data from the static JSON file
const loadSummaryData = async () => {
  try {
    // Fetch the JSON data
    const response = await fetch("data/summary-stats.json");
    const summaryData = await response.json();

    // You can store it in a global variable or update the UI
    return summaryData;
  } catch (error) {
    console.error("Error loading summary data:", error);
  }
};

// Call loadSummaryData on page load
window.onload = async () => {
  const summaryData = await loadSummaryData();
  // You can now pass summaryData to your functions, for example:
  updateSummaryStats(summaryData);
};

// Run this once on page load to apply the default filter
document.addEventListener("DOMContentLoaded", () => {
  const statusSelect = document.getElementById("statusSelect");
  const districtSelect = document.getElementById("districtSelect");
  const downloadBtn = document.getElementById("downloadBtn");
  const drawer = document.querySelector(".drawer-placement");
  const openButton = document.querySelector(".openDrawer");
  const closeButton = drawer.querySelector(".close-button");
  const legendPreConstruction = document.getElementById(
    "legend-pre-construction"
  );
  const legendUnderConstruction = document.getElementById(
    "legend-under-construction"
  );
  const legendConstructionComplete = document.getElementById(
    "legend-construction-complete"
  );
  const legendAll = document.getElementById("legend-all");
  const radioGroup = document.querySelector("sl-radio-group");

  // if window.innerWidth is less than 768, remove downloadBtn
  if (window.innerWidth < 768) {
    downloadBtn.remove();
  }

  // ✅ Show Pre-Construction legend by default on load
  legendPreConstruction.style.display = "block";
  legendUnderConstruction.style.display = "none";
  legendConstructionComplete.style.display = "none";
  legendAll.style.display = "none";

  if (statusSelect && districtSelect) {
    statusSelect.addEventListener("sl-change", () => {
      updateMapLayer();
      setTimeout(() => {
        filterAndUpdateTable();
      }, 100);

      // Show or hide the legends based on the selected value
      if (statusSelect.value === "PRE-CONSTRUCTION") {
        legendPreConstruction.style.display = "block";
        legendUnderConstruction.style.display = "none";
        legendConstructionComplete.style.display = "none";
        legendAll.style.display = "none";
      } else if (statusSelect.value === "UNDER-CONSTRUCTION") {
        legendPreConstruction.style.display = "none";
        legendUnderConstruction.style.display = "block";
        legendConstructionComplete.style.display = "none";
        legendAll.style.display = "none";
      } else if (statusSelect.value === "COMPLETED-CONSTRUCTION") {
        legendPreConstruction.style.display = "none";
        legendUnderConstruction.style.display = "none";
        legendConstructionComplete.style.display = "block";
        legendAll.style.display = "none";
      } else if (statusSelect.value === "ALL") {
        legendPreConstruction.style.display = "none";
        legendUnderConstruction.style.display = "none";
        legendConstructionComplete.style.display = "none";
        legendAll.style.display = "block";
      }
    });

    districtSelect.addEventListener("sl-change", () => {
      updateMapLayer();
      setTimeout(() => {
        filterAndUpdateTable();
      }, 100);
    });

    // Run both functions once on load
    updateMapLayer();
    filterAndUpdateTable();
  } else {
    console.error("statusSelect element not found at DOMContentLoaded.");
  }

  // Attach event listener to download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const csvFile = "GDOT_export.csv";
      const link = document.createElement("a");
      link.href = csvFile;
      link.download = csvFile;
      link.click();
    });
  } else {
    console.error("downloadBtn element not found at DOMContentLoaded.");
  }

  openButton.addEventListener("click", () => drawer.show());

  // Attach event listener to close button
  if (drawer && closeButton) {
    closeButton.addEventListener("click", () => drawer.hide());
  } else {
    console.error("drawer or closeButton not found at DOMContentLoaded.");
  }

  // Attach event listener to radio group to change basemap
  radioGroup.addEventListener("sl-change", (event) => {
    const selectedValue = event.target.value;

    // Define the new tile URL based on selection
    const newTileUrl =
      selectedValue === "dark"
        ? "https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
        : "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png";

    // ✅ Update the tile source with new URL
    map.getSource("carto").setTiles([newTileUrl]);
  });

  // Attach event listeners to the dropdowns
  document
    .getElementById("statusSelect")
    .addEventListener("sl-change", async () => {
      const summaryData = await loadSummaryData(); // Reload data if needed
      updateSummaryStats(summaryData);
    });

  document
    .getElementById("districtSelect")
    .addEventListener("sl-change", async () => {
      const summaryData = await loadSummaryData(); // Reload data if needed
      updateSummaryStats(summaryData);
    });
});
