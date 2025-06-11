/**
 * Map Legend Module
 * Manages the legend display based on project status filters
 */

/**
 * Creates and updates the map legend based on status filter
 * @param {Object} statusColors - Object mapping status values to color codes
 * @param {string} statusFilter - Currently selected status filter
 * @param {Object} statusMapping - Object mapping HTML status values to GeoJSON status values
 */
export function updateLegend(statusColors, statusFilter, statusMapping) {
    const legendContainer = document.getElementById('map-legend');

    // Clear any existing legend content
    legendContainer.innerHTML = '';

    // Create legend title
    const title = document.createElement('h4');
    title.textContent = 'Project Status';
    legendContainer.appendChild(title);

    // Format status labels to be more readable
    const formatStatusLabel = (status) => {
        // First replace hyphens and underscores with spaces
        let formatted = status.replace(/-/g, ' ').replace(/_/g, ' ');

        // Convert to lowercase
        formatted = formatted.toLowerCase();

        // Capitalize first letter of each word for sentence case
        return formatted.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // If "All" is selected, show all status options
    if (statusFilter === 'All') {
        // Create a legend item for each status
        Object.entries(statusColors).forEach(([status, color]) => {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const key = document.createElement('span');
            key.className = 'legend-key';
            key.style.backgroundColor = color;

            const value = document.createElement('span');
            value.textContent = formatStatusLabel(status);

            item.appendChild(key);
            item.appendChild(value);
            legendContainer.appendChild(item);
        });
    } else {
        // Show only the selected status
        const geoJSONStatus = statusMapping[statusFilter];
        if (geoJSONStatus && statusColors[geoJSONStatus]) {
            const item = document.createElement('div');
            item.className = 'legend-item';

            const key = document.createElement('span');
            key.className = 'legend-key';
            key.style.backgroundColor = statusColors[geoJSONStatus];

            const value = document.createElement('span');
            value.textContent = formatStatusLabel(geoJSONStatus);

            item.appendChild(key);
            item.appendChild(value);
            legendContainer.appendChild(item);
        }
    }
}

/**
 * Initialize the legend and set up event listeners
 * @param {Object} map - The Mapbox GL JS map instance
 * @param {Object} statusColors - Object mapping status values to color codes
 * @param {Object} statusMapping - Object mapping HTML status values to GeoJSON status values
 */
export function initLegend(map, statusColors, statusMapping) {
    const statusSelect = document.getElementById('statusSelect');

    // Update legend with initial values
    updateLegend(statusColors, statusSelect.value, statusMapping);

    // Update legend when status changes
    statusSelect.addEventListener('sl-change', (event) => {
        updateLegend(statusColors, event.target.value, statusMapping);
    });
} 