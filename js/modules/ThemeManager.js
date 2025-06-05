// Handles all theme-related functionality for the application

// Theme constants
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

// Theme-specific styles
const THEME_STYLES = {
    [THEMES.LIGHT]: {
        basemapUrl: 'https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png',
        boundaryColor: '#000000',
        textColor: '#000000'
    },
    [THEMES.DARK]: {
        basemapUrl: 'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
        boundaryColor: '#ffffff',
        textColor: '#ffffff'
    }
};

// Keep track of the current theme
let currentTheme = THEMES.LIGHT;

/**
 * Initializes the theme manager and sets up event listeners
 * @param {Object} map - The Mapbox GL map instance
 * @returns {Object} - The theme manager API
 */
export function initThemeManager(map) {
    // Set up theme toggle listener
    const themeToggle = document.querySelector('.radio-container-theme sl-radio-group');

    // apply initial theme
    applyTheme(map, currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('sl-change', (event) => {
            const selectedTheme = event.target.value;
            applyTheme(map, selectedTheme);
        });
    }

    // Return the theme manager API
    return {
        getCurrentTheme: () => currentTheme,
        applyTheme: (theme) => applyTheme(map, theme),
        updateBoundaryColors: () => updateBoundaryColors(map)
    };
}

/**
 * Applies the specified theme to the map and boundaries
 * @param {Object} map - The Mapbox GL map instance
 * @param {string} theme - The theme to apply ('light' or 'dark')
 */
function applyTheme(map, theme) {
    if (!THEME_STYLES[theme]) {
        console.error(`Invalid theme: ${theme}`);
        return;
    }

    currentTheme = theme;

    // Update the basemap tiles
    updateBasemap(map, theme);

    // Update boundary colors if they exist
    updateBoundaryColors(map);

    // Update text color
    updateTextColors(theme);
}

/**
 * Updates the basemap tiles based on the current theme
 * @param {Object} map - The Mapbox GL map instance
 * @param {string} theme - The theme to apply
 */
function updateBasemap(map, theme) {
    if (!map.getSource('carto')) {
        console.warn('Carto source not found on map');
        return;
    }

    const newTileUrl = THEME_STYLES[theme].basemapUrl;
    map.getSource('carto').setTiles([newTileUrl]);
}

/**
 * Updates the boundary layer colors based on the current theme
 * @param {Object} map - The Mapbox GL map instance
 */
function updateBoundaryColors(map) {
    // List of all boundary layers that need color updates
    const boundaryLayers = [
        'selected-boundary-outline',
        'unselected-boundary-outline'
    ];

    const boundaryColor = THEME_STYLES[currentTheme].boundaryColor;

    // Update each boundary layer if it exists
    boundaryLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.setPaintProperty(
                layerId,
                'line-color',
                boundaryColor
            );
        }
    });

}

/**
 * Returns the appropriate boundary style based on the current theme
 * @param {string} geographyType - The type of geography (Statewide, County, etc.)
 * @returns {Object} - The boundary style object
 */
export function getBoundaryStyle(geographyType) {
    // Get current theme's boundary color
    const boundaryColor = THEME_STYLES[currentTheme].boundaryColor;

    return {
        "line-color": boundaryColor,
        "line-width": 1,
        // Add any other style properties specific to the geography type if needed
    };
}

/**
 * Updates text elements based on the current theme
 * @param {string} theme - The theme to apply
 */
function updateTextColors(theme) {
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.style.color = THEME_STYLES[theme].textColor;
        // Remove text shadow in dark mode, add it in light mode
        lastUpdatedElement.style.textShadow = 'none';
    }
}

/**
 * Returns the current theme
 * @returns {string} - The current theme ('light' or 'dark')
 */
export function getCurrentTheme() {
    return currentTheme;
}
