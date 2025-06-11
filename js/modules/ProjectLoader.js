// Maps geography types to their corresponding project GeoJSON files.
// Using a base URL approach to handle both local and GitHub Pages deployments
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '../..'  // Local development
    : '.';     // GitHub Pages or production

const PROJECT_FILE_PATHS = {
    Statewide: `${BASE_URL}/data/projects/statewide_projects.geojson`,
    District: `${BASE_URL}/data/projects/district_projects.geojson`,
    County: `${BASE_URL}/data/projects/county_projects.geojson`,
    City: `${BASE_URL}/data/projects/city_projects.geojson`,
};

// Map HTML select option values to GeoJSON status values
export const STATUS_MAPPING = {
    "Pre_Construction": "PRE-CONSTRUCTION",
    "Under_Construction": "UNDER-CONSTRUCTION",
    "Completed_Construction": "COMPLETED-CONSTRUCTION",
    "All": null // null indicates no filter should be applied
};

// Define colors for each status
export const STATUS_COLORS = {
    "PRE-CONSTRUCTION": "#3498db", // Blue
    "UNDER-CONSTRUCTION": "#f39c12", // Orange
    "COMPLETED-CONSTRUCTION": "#27ae60" // Green
};

// Import the map legend module
import { initLegend, updateLegend } from './MapLegend.js';

/**
 * Loads project GeoJSON data based on the selected geography type.
 * @param {string} geographyType - The selected geography type (Statewide, District, County, or City).
 * @returns {Promise<Object>} - A Promise resolving to the GeoJSON data.
 */
export async function loadProjectGeoJSON(geographyType) {
    const filePath = PROJECT_FILE_PATHS[geographyType];

    if (!filePath) {
        throw new Error(`Invalid geography type: ${geographyType}`);
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch project GeoJSON: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading project GeoJSON for ${geographyType}:`, error);
        throw error;
    }
}

/**
 * Filters GeoJSON data based on the selected status
 * @param {Object} data - The GeoJSON data to filter
 * @param {string} status - The selected status filter value
 * @returns {Object} - Filtered GeoJSON data
 */
function filterProjectsByStatus(data, status) {
    // If status is "All" (maps to null), return all data
    if (!STATUS_MAPPING[status]) {
        return data;
    }

    // Create a deep copy of the GeoJSON to avoid modifying the original
    const filteredData = JSON.parse(JSON.stringify(data));

    // Filter features based on status
    filteredData.features = filteredData.features.filter(feature =>
        feature.properties && feature.properties.Status === STATUS_MAPPING[status]
    );

    return filteredData;
}

/**
 * Adds project data to the map as a line layer
 * @param {Object} map - The Mapbox GL JS map instance
 * @param {Object} projectData - The GeoJSON project data
 * @param {string} geographyType - The geography type
 * @param {string} statusFilter - The selected status filter
 */
export function addProjectsToMap(map, projectData, geographyType, statusFilter = "All") {
    const sourceId = "projects-source";
    const layerId = "projects-layer";

    // Remove existing layers and source if they exist
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }

    // Filter data based on status if needed
    const filteredData = filterProjectsByStatus(projectData, statusFilter);

    // Add the GeoJSON as a source
    map.addSource(sourceId, {
        type: "geojson",
        data: filteredData
    });

    // Look for existing label layers to place projects below them
    const labelLayerId = "boundary-labels";
    const unselectedLabelLayerId = "boundary-labels-unselected";
    let beforeLayerId = null;

    // If we're loading District geography, check if labels exist
    // and add projects below the bottom-most label layer
    if (geographyType === "District") {
        // Check for both label layers and choose the bottom one to place projects below
        if (map.getLayer(unselectedLabelLayerId)) {
            beforeLayerId = unselectedLabelLayerId;
        } else if (map.getLayer(labelLayerId)) {
            beforeLayerId = labelLayerId;
        }
    }

    // Add the layer with appropriate styling for lines
    // If beforeLayerId is set, add the layer below that layer
    if (beforeLayerId) {
        map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                // Color lines based on status
                "line-color": [
                    "match",
                    ["get", "Status"],
                    "PRE-CONSTRUCTION", STATUS_COLORS["PRE-CONSTRUCTION"],
                    "UNDER-CONSTRUCTION", STATUS_COLORS["UNDER-CONSTRUCTION"],
                    "COMPLETED-CONSTRUCTION", STATUS_COLORS["COMPLETED-CONSTRUCTION"],
                    "#FF6B6B" // Default color for any other status
                ],
                "line-width": 3,
                "line-opacity": 0.8
            }
        }, beforeLayerId); // Add below the label layer
    } else {
        // Add normally if no label layer found
        map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: {
                "line-join": "round",
                "line-cap": "round"
            },
            paint: {
                // Color lines based on status
                "line-color": [
                    "match",
                    ["get", "Status"],
                    "PRE-CONSTRUCTION", STATUS_COLORS["PRE-CONSTRUCTION"],
                    "UNDER-CONSTRUCTION", STATUS_COLORS["UNDER-CONSTRUCTION"],
                    "COMPLETED-CONSTRUCTION", STATUS_COLORS["COMPLETED-CONSTRUCTION"],
                    "#FF6B6B" // Default color for any other status
                ],
                "line-width": 3,
                "line-opacity": 0.8
            }
        });
    }

    // Keep the pointer cursor on hover
    map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
    });

    // Update the legend to match the current status filter
    updateLegend(STATUS_COLORS, statusFilter, STATUS_MAPPING);
}

/**
 * Sets up an event listener for the geography selection radio buttons.
 * When the selection changes, it loads the corresponding project GeoJSON.
 * @param {Object} map - The Mapbox GL JS map instance
 */
export function setupProjectLoaderListener(map) {
    const geographySelect = document.getElementById("geographySelect");
    const statusSelect = document.getElementById("statusSelect");

    if (!geographySelect) {
        console.error("Geography select element not found");
        return;
    }

    if (!statusSelect) {
        console.error("Status select element not found");
        return;
    }

    // Initialize the legend
    initLegend(map, STATUS_COLORS, STATUS_MAPPING);

    // Wait for the map to be fully loaded
    if (!map.loaded()) {
        map.on("load", () => {
            loadInitialProjects();
        });
    } else {
        loadInitialProjects();
    }

    function loadInitialProjects() {
        // Load projects for the initial selection
        const initialGeography = geographySelect.value || "District";
        const initialStatus = statusSelect.value || "All";

        loadProjectGeoJSON(initialGeography)
            .then(data => addProjectsToMap(map, data, initialGeography, initialStatus))
            .catch(console.error);
    }

    // Set up event listener for changes to the geography selection
    geographySelect.addEventListener("sl-change", (event) => {
        const selectedGeography = event.target.value;
        const selectedStatus = statusSelect.value;

        loadProjectGeoJSON(selectedGeography)
            .then(data => addProjectsToMap(map, data, selectedGeography, selectedStatus))
            .catch(console.error);
    });

    // Set up event listener for changes to the status selection
    statusSelect.addEventListener("sl-change", (event) => {
        const selectedGeography = geographySelect.value;
        const selectedStatus = event.target.value;

        loadProjectGeoJSON(selectedGeography)
            .then(data => addProjectsToMap(map, data, selectedGeography, selectedStatus))
            .catch(console.error);
    });
}