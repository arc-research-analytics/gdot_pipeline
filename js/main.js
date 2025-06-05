// import modules
import { initializeMap } from "./modules/MapCore.js";
import { setupGeographyRadioListener } from "./modules/GeoBoundaryLoader.js";
import { initThemeManager } from "./modules/ThemeManager.js";
import { updateProjectLayers } from "./modules/ProjectLoader.js";
import { applyMapView } from "./modules/MapViewConfig.js";

// Base URL for relative paths (same approach as in other modules)
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Local development - empty because we're already in js/
  : '.'; // GitHub Pages or production

// temporary location; will move to DOMContentLoaded later
const map = initializeMap();

// Initialize the theme manager
const themeManager = initThemeManager(map);

// Get reference to the geography selection element
const geographySelect = document.getElementById("geographySelect");
const geoDropdownSelect = document.getElementById("geoDropdownSelect");
const statusSelect = document.getElementById("statusSelect");

// Function to update project layers safely after map movement is complete
function updateProjectLayersAfterMapMovement(geographyType) {
  // Check if map is already moving
  if (map.isMoving()) {
    // Wait for map movement to finish
    map.once('moveend', () => {
      // Add a small delay after movement ends
      setTimeout(() => {
        updateProjectLayers(map, geographyType);
      }, 300);
    });
  } else {
    // If map is not moving, still add a small delay for safety
    setTimeout(() => {
      updateProjectLayers(map, geographyType);
    }, 300);
  }
}

// Wait for map to load before setting up listeners
map.on('load', () => {
  // Get initial values
  const initialGeography = geographySelect.value || "District";
  const initialJurisdiction = geoDropdownSelect.value;

  // Ensure we apply the correct initial view
  applyMapView(map, initialGeography, initialJurisdiction);

  // Wait for map to finish moving before loading projects
  map.once('moveend', () => {
    setTimeout(() => {
      updateProjectLayers(map, initialGeography);
    }, 500);
  });
});

// set up the event listener for the geography selection radio buttons
// This will handle boundary updates
setupGeographyRadioListener(map);

// Add event listener to update project layers when geography changes
if (geographySelect) {
  geographySelect.addEventListener("sl-change", (event) => {
    const selectedGeography = event.target.value;
    // Wait for map movement to finish before updating project layers
    updateProjectLayersAfterMapMovement(selectedGeography);
  });
}

// Add event listener to update project layers when jurisdiction changes
if (geoDropdownSelect) {
  geoDropdownSelect.addEventListener("sl-change", (event) => {
    const currentGeography = geographySelect.value;
    // Wait for map movement to finish before updating project layers
    updateProjectLayersAfterMapMovement(currentGeography);
  });
}

// Add event listener to update project layers when status filter changes
if (statusSelect) {
  statusSelect.addEventListener("sl-change", (event) => {
    const currentGeography = geographySelect.value;
    // No need to wait for map movement since status filter doesn't move the map
    setTimeout(() => {
      updateProjectLayers(map, currentGeography);
    }, 100);
  });
}

// Run this once on page load to apply the default filter
document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadBtn");
  const drawer = document.querySelector(".drawer-placement");
  const openButton = document.querySelector(".openDrawer");
  const closeButton = drawer.querySelector(".close-button");

  // if window.innerWidth is less than 768, remove downloadBtn
  if (window.innerWidth < 768) {
    downloadBtn.remove();
  }

  // Attach event listener to download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const csvFile = `${BASE_URL}/GDOT_export_joined.csv`;
      const link = document.createElement("a");
      link.href = csvFile;
      link.download = "GDOT_export.csv"; // Set the desired file name
      document.body.appendChild(link); // Add the link to the DOM
      link.click();
      document.body.removeChild(link); // Clean up after download
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
});
