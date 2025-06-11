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
        unselectedBoundaryColor: '#737373',
        selectedBoundaryColor: '#000000',
        unselectedLineWidth: 0.5,
        selectedLineWidth: 2,
        textColor: '#000000',
        // Label styles
        selectedLabelColor: '#000000',
        unselectedLabelColor: '#757575',
        selectedLabelHaloColor: '#ffffff',
        unselectedLabelHaloColor: '#ffffff',
        selectedLabelHaloWidth: 2,
        unselectedLabelHaloWidth: 0.5
    },
    [THEMES.DARK]: {
        basemapUrl: 'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png',
        unselectedBoundaryColor: '#5a5a5a',
        selectedBoundaryColor: '#ffffff',
        unselectedLineWidth: 0.5,
        selectedLineWidth: 2,
        textColor: '#ffffff',
        // Label styles
        selectedLabelColor: '#ffffff',
        unselectedLabelColor: '#a0a0a0',
        selectedLabelHaloColor: '#000000',
        unselectedLabelHaloColor: '#262626',
        selectedLabelHaloWidth: 2,
        unselectedLabelHaloWidth: 0.5
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
    const themeStyle = THEME_STYLES[currentTheme];

    // Update selected boundary outline
    if (map.getLayer('selected-boundary-outline')) {
        map.setPaintProperty(
            'selected-boundary-outline',
            'line-color',
            themeStyle.selectedBoundaryColor
        );
        map.setPaintProperty(
            'selected-boundary-outline',
            'line-width',
            themeStyle.selectedLineWidth
        );
    }

    // Update unselected boundary outline
    if (map.getLayer('unselected-boundary-outline')) {
        map.setPaintProperty(
            'unselected-boundary-outline',
            'line-color',
            themeStyle.unselectedBoundaryColor
        );
        map.setPaintProperty(
            'unselected-boundary-outline',
            'line-width',
            themeStyle.unselectedLineWidth
        );
    }

    // Make sure fills are transparent
    if (map.getLayer('selected-boundary')) {
        map.setPaintProperty(
            'selected-boundary',
            'fill-opacity',
            0
        );
    }

    // Update label styles
    // Selected labels
    if (map.getLayer('boundary-labels')) {
        map.setPaintProperty(
            'boundary-labels',
            'text-color',
            themeStyle.selectedLabelColor
        );
        map.setPaintProperty(
            'boundary-labels',
            'text-halo-color',
            themeStyle.selectedLabelHaloColor
        );
        map.setPaintProperty(
            'boundary-labels',
            'text-halo-width',
            themeStyle.selectedLabelHaloWidth
        );
    }

    // Unselected labels
    if (map.getLayer('boundary-labels-unselected')) {
        map.setPaintProperty(
            'boundary-labels-unselected',
            'text-color',
            themeStyle.unselectedLabelColor
        );
        map.setPaintProperty(
            'boundary-labels-unselected',
            'text-halo-color',
            themeStyle.unselectedLabelHaloColor
        );
        map.setPaintProperty(
            'boundary-labels-unselected',
            'text-halo-width',
            themeStyle.unselectedLabelHaloWidth
        );
    }

    // Force label source refresh if it exists
    if (map.getSource('label-source')) {
        try {
            const data = map.getSource('label-source')._data;
            setTimeout(() => {
                map.getSource('label-source').setData(data);
            }, 50);
        } catch (error) {
            console.warn('Could not refresh label source:', error);
        }
    }
}

/**
 * Returns the appropriate boundary style based on the current theme and selection state
 * @param {string} geographyType - The type of geography (Statewide, County, etc.)
 * @param {boolean} isSelected - Whether this is for the selected area
 * @returns {Object} - The boundary style object
 */
export function getBoundaryStyle(geographyType, isSelected = false) {
    const themeStyle = THEME_STYLES[currentTheme];

    if (isSelected) {
        return {
            "line-color": themeStyle.selectedBoundaryColor,
            "line-width": themeStyle.selectedLineWidth,
        };
    } else {
        return {
            "line-color": themeStyle.unselectedBoundaryColor,
            "line-width": themeStyle.unselectedLineWidth,
        };
    }
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

/**
 * Returns the appropriate label style based on the current theme and selection state
 * @param {boolean} isSelected - Whether this is for the selected area
 * @returns {Object} - The label style object
 */
export function getLabelStyle(isSelected = false) {
    const themeStyle = THEME_STYLES[currentTheme];

    if (isSelected) {
        return {
            "text-color": themeStyle.selectedLabelColor,
            "text-halo-color": themeStyle.selectedLabelHaloColor,
            "text-halo-width": themeStyle.selectedLabelHaloWidth
        };
    } else {
        return {
            "text-color": themeStyle.unselectedLabelColor,
            "text-halo-color": themeStyle.unselectedLabelHaloColor,
            "text-halo-width": themeStyle.unselectedLabelHaloWidth
        };
    }
}
