// Maps geography types to their corresponding project geojson files
// Using a base URL approach to handle both local and GitHub Pages deployments
const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '../..'  // Local development
    : '.';     // GitHub Pages or production

const PROJECT_FILE_PATHS = {
    Statewide: `${BASE_URL}/data/projects/statewide_projects.geojson`,
    County: `${BASE_URL}/data/projects/county_projects.geojson`,
    City: `${BASE_URL}/data/projects/city_projects.geojson`,
    District: `${BASE_URL}/data/projects/district_projects.geojson`,
};

// Loads project GeoJSON data based on the selected geography type
async function loadProjectGeoJSON(geographyType) {
    const filePath = PROJECT_FILE_PATHS[geographyType];

    if (!filePath) {
        throw new Error(`Invalid geography type: ${geographyType}`);
    }

    try {
        console.log(`Fetching project data from: ${filePath}`);
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error(`Failed to fetch project geojson: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error loading project geojson for ${geographyType}:`, error);
        throw error;
    }
}

// Helper function to check if a project matches the selected jurisdiction
function isProjectInJurisdiction(feature, selectedJurisdiction, geographyType) {
    if (!feature.properties) {
        return false;
    }

    // For statewide, include all projects regardless of jurisdiction
    if (geographyType === "Statewide") {
        return true;
    }

    // For District, County, and City, filter by the jurisdiction_id field
    switch (geographyType) {
        case "District":
            // Convert to number for comparison since district is typically stored as a number
            const districtNumber = parseInt(selectedJurisdiction, 10);
            return feature.properties.jurisdiction_id === districtNumber;

        case "County":
            // Handle spaces from underscore conversion if needed
            const countyName = selectedJurisdiction.replace(/_/g, ' ');
            return feature.properties.jurisdiction === countyName ||
                feature.properties.jurisdiction === selectedJurisdiction;

        case "City":
            // Handle spaces from underscore conversion if needed
            const cityName = selectedJurisdiction.replace(/_/g, ' ');
            return feature.properties.jurisdiction === cityName ||
                feature.properties.jurisdiction === selectedJurisdiction;

        default:
            return false;
    }
}

// Helper function to check if a project matches the selected status
function isProjectMatchingStatus(feature, selectedStatus) {
    if (!feature.properties || !feature.properties.Status) {
        return false;
    }

    // If ALL is selected, include all projects
    if (selectedStatus === "ALL") {
        return true;
    }

    // Otherwise, match the exact status
    return feature.properties.Status === selectedStatus;
}

// Updates the map with project layers based on the selected geography
export async function updateProjectLayers(map, geographyType) {
    const sourceId = "projects-source";
    const layerId = "projects-layer";
    const labelLayerId = "boundary-labels"; // The ID of the label layer from GeoBoundaryLoader.js

    console.log(`Loading projects for ${geographyType}`);

    try {
        // Load the project GeoJSON data for the selected geography type
        let projectData = await loadProjectGeoJSON(geographyType);

        // Get the current jurisdiction selection
        const geoDropdownSelect = document.getElementById("geoDropdownSelect");
        let selectedJurisdiction = null;
        if (geoDropdownSelect) {
            selectedJurisdiction = geoDropdownSelect.value;
            console.log(`Selected jurisdiction for ${geographyType}:`, selectedJurisdiction);
        }

        // Get the current status selection
        const statusSelect = document.getElementById("statusSelect");
        let selectedStatus = "ALL";
        if (statusSelect) {
            selectedStatus = statusSelect.value;
            console.log(`Selected status: ${selectedStatus}`);
        }

        // Apply both filters - first jurisdiction, then status
        if (projectData.features && projectData.features.length > 0) {
            const originalCount = projectData.features.length;

            // Apply jurisdiction filter (except for Statewide)
            if (geographyType !== "Statewide" && selectedJurisdiction) {
                projectData.features = projectData.features.filter(feature =>
                    isProjectInJurisdiction(feature, selectedJurisdiction, geographyType)
                );
                console.log(`Filtered by jurisdiction from ${originalCount} to ${projectData.features.length} projects`);
            }

            // Apply status filter
            const afterJurisdictionCount = projectData.features.length;
            projectData.features = projectData.features.filter(feature =>
                isProjectMatchingStatus(feature, selectedStatus)
            );
            console.log(`Filtered by status from ${afterJurisdictionCount} to ${projectData.features.length} projects`);
        }

        // Wait for the map to be loaded
        if (!map.loaded()) {
            await new Promise((resolve) => map.once("load", resolve));
        }

        // Remove existing project layers and source if they exist
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }

        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }

        // Check if we have any features left after filtering
        if (!projectData.features || projectData.features.length === 0) {
            console.warn(`No projects found after filtering`);
            return;
        }

        // Add the projects as a new source
        map.addSource(sourceId, {
            type: "geojson",
            data: projectData,
        });

        // Add the project layer with styling based on status
        map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
                // Line color based on project status
                "line-color": [
                    "match",
                    ["get", "Status"],
                    "PRE-CONSTRUCTION", "#F39C12",
                    "UNDER-CONSTRUCTION", "#2ECC71",
                    "COMPLETED-CONSTRUCTION", "#2980B9",
                    "#000000" // default color
                ],
                "line-width": 3,
                "line-opacity": 1.0
            }
        });

        // Move the label layer to the top if it exists
        // This ensures labels are drawn on top of the project lines
        if (map.getLayer(labelLayerId)) {
            map.moveLayer(labelLayerId);
        }

        // Add click event for project popups
        setupProjectPopups(map, layerId);

        // Update the legend based on the selected status
        updateLegend(selectedStatus);

        return projectData;
    } catch (error) {
        console.error(`Error updating project layers for ${geographyType}:`, error);
        throw error;
    }
}

// Updates the legend visibility based on selected status
function updateLegend(selectedStatus) {
    // Get all legend elements
    const preConstructionLegend = document.getElementById("legend-pre-construction");
    const underConstructionLegend = document.getElementById("legend-under-construction");
    const completedLegend = document.getElementById("legend-construction-complete");
    const allLegend = document.getElementById("legend-all");

    // Hide all legends first
    preConstructionLegend.style.display = "none";
    underConstructionLegend.style.display = "none";
    completedLegend.style.display = "none";
    allLegend.style.display = "none";

    // Show the appropriate legend based on the selected status
    switch (selectedStatus) {
        case "PRE-CONSTRUCTION":
            preConstructionLegend.style.display = "block";
            break;
        case "UNDER-CONSTRUCTION":
            underConstructionLegend.style.display = "block";
            break;
        case "COMPLETED-CONSTRUCTION":
            completedLegend.style.display = "block";
            break;
        case "ALL":
            allLegend.style.display = "block";
            break;
    }
}

// Sets up popups for project features
function setupProjectPopups(map, layerId) {
    // First remove any existing click handlers to prevent duplicates
    map.off('click', layerId);
    map.off('mouseenter', layerId);
    map.off('mouseleave', layerId);

    // Create a popup but don't add it to the map yet
    const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true
    });

    // Add click event to show popup with project details
    map.on('click', layerId, (e) => {
        // Change the cursor style as a UI indicator
        map.getCanvas().style.cursor = 'pointer';

        // Get the feature at the clicked point
        const feature = e.features[0];
        const props = feature.properties;

        // Format the popup content
        const content = `
      <h3>${props.ProjectName || 'Unnamed Project'}</h3>
      <p><strong>ID:</strong> ${props.ProjectID || 'N/A'}</p>
      <p><strong>Status:</strong> ${props.Status || 'N/A'}</p>
      <p><strong>Cost:</strong> $${formatCurrency(props.Cost) || 'N/A'}</p>
      <p><strong>Description:</strong> ${props.Description || 'No description available'}</p>
    `;

        // Set the popup coordinates and content
        popup
            .setLngLat(e.lngLat)
            .setHTML(content)
            .addTo(map);
    });

    // Change cursor to pointer when hovering over a project
    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change cursor back when leaving a project
    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
    });
}

// Helper function to format currency numbers
function formatCurrency(value) {
    if (!value) return '0';

    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;

    // Format with commas for thousands
    return numValue.toLocaleString('en-US');
} 