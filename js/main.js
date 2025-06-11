// import modules
import { initializeMap } from "./modules/MapCore.js";
import { setupGeographyRadioListener } from "./modules/GeoBoundaryLoader.js";
import { initThemeManager } from "./modules/ThemeManager.js";
import { setupProjectLoaderListener } from './modules/ProjectLoader.js';

// Base URL for relative paths (same approach as in other modules)
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Local development - empty because we're already in js/
  : '.'; // GitHub Pages or production

// Initialize map
const map = initializeMap();

// Initialize the theme manager
const themeManager = initThemeManager(map);

// Wait for map to load before setting up listeners
map.on('load', () => {

  // Set up the event listener for geography selection
  setupGeographyRadioListener(map);

  // Set up the event listener for project loading
  setupProjectLoaderListener(map);

});

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
