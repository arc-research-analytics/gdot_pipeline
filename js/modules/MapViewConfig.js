// Map view configurations for different geography levels and selections
// Format: [longitude, latitude, zoom]

// Default view for the entire state of Georgia
export const STATEWIDE_VIEW = [-83.643, 32.9, 6.5];

// District views - Congressional districts
export const DISTRICT_VIEWS = {
    "1": [-82.0, 31.5, 7.5],
    "2": [-84.6341303139434, 31.780249096595877, 7.5],
    "3": [-84.74920828124624, 33.2275417109076, 8],
    "4": [-84.20189307654802, 33.8240227276689, 9.9],
    "5": [-84.39072341866728, 33.683915230467136, 10.1],
    "6": [-84.59555983817853, 33.713156170757266, 9.6],
    "7": [-84.11945925897359, 34.33320399825942, 8.9],
    "8": [-83.25148779041328, 31.930579952851668, 7.4],
    "9": [-83.9, 34.5, 8.5],
    "10": [-83.4, 33.9, 7.9],
    "11": [-84.7, 34.31, 9.0],
    "12": [-82.3, 32.95, 7.5],
    "13": [-84.1, 33.68, 9.3],
    "14": [-85.0, 34.5, 8.2]
};

// County views
export const COUNTY_VIEWS = {
    "Barrow": [-83.7, 34.0, 10.0],
    "Bartow": [-84.8, 34.2, 9.5],
    "Carroll": [-85.0, 33.6, 9.5],
    "Cherokee": [-84.5, 34.2, 9.5],
    "Clayton": [-84.4, 33.5, 10.0],
    "Cobb": [-84.6, 33.9, 9.7],
    "Coweta": [-84.8, 33.4, 9.5],
    "Dawson": [-84.1, 34.45, 10.0],
    "DeKalb": [-84.2, 33.8, 9.7],
    "Douglas": [-84.8, 33.7, 10.0],
    "Fayette": [-84.5, 33.4, 10.0],
    "Forsyth": [-84.1, 34.2, 10.0],
    "Fulton": [-84.4, 33.8, 9.0],
    "Gwinnett": [-84.0, 34.0, 9.5],
    "Hall": [-83.8, 34.3, 9.5],
    "Henry": [-84.2, 33.5, 9.5],
    "Newton": [-83.8, 33.58, 10.0],
    "Paulding": [-84.9, 33.9, 9.7],
    "Rockdale": [-84.0, 33.65, 10.5],
    "Spalding": [-84.3, 33.3, 10.0],
    "Walton": [-83.7, 33.79, 10.0]
};

// City views | Pan west: MORE negative | Pan north: HIGHER number | zoom in: HIGHER number
export const CITY_VIEWS = {
    "Acworth": [-84.68, 34.07, 11.2],
    "Alpharetta": [-84.28, 34.07, 11.1],
    "Atlanta": [-84.39, 33.78, 10.5],
    "Auburn": [-83.83, 34.02, 11.9],
    "Austell": [-84.66, 33.82, 12.0],
    "Avondale Estates": [-84.26, 33.78, 11.9],
    "Ball Ground": [-84.38, 34.35, 11.9],
    "Berkeley Lake": [-84.18, 33.98, 12.1],
    "Braselton": [-83.80, 34.11, 11.9],
    "Brookhaven": [-84.33, 33.87, 11.9],
    "Brooks": [-84.45, 33.29, 11.9],
    "Buford": [-84.00, 34.12, 11.8],
    "Canton": [-84.5, 34.25, 11.6],
    "Carrollton": [-85.10, 33.58, 11.5],
    "Cartersville": [-84.80, 34.18, 11.2],
    "Chamblee": [-84.29, 33.88, 11.9],
    "Chattahoochee Hills": [-84.75, 33.58, 11.3],
    "Clarkston": [-84.24, 33.81, 11.9],
    "Clermont": [-83.77, 34.48, 12.1],
    "College Park": [-84.45, 33.64, 11.9],
    "Conyers": [-84.0, 33.67, 11.5],
    "Covington": [-83.85, 33.61, 11.9],
    "Cumming": [-84.14, 34.21, 12.1],
    "Dacula": [-83.89, 33.98, 11.9],
    "Dallas": [-84.85, 33.92, 11.9],
    "Dawsonville": [-84.12, 34.44, 11.9],
    "Decatur": [-84.28, 33.78, 12.0],
    "Doraville": [-84.28, 33.90, 11.9],
    "Douglasville": [-84.71, 33.75, 11.9],
    "Duluth": [-84.14, 34.01, 12.0],
    "Dunwoody": [-84.33, 33.94, 12.0],
    "East Point": [-84.46, 33.66, 11.2],
    "Emerson": [-84.75, 34.127, 11.5],
    "Fairburn": [-84.61, 33.55, 11.9],
    "Fayetteville": [-84.46, 33.45, 12.0],
    "Flowery Branch": [-83.92, 34.18, 11.9],
    "Forest Park": [-84.36, 33.62, 11.9],
    "Gainesville": [-83.82, 34.29, 11.5],
    "Grayson": [-83.96, 33.89, 12.1],
    "Griffin": [-84.25, 33.24, 11.9],
    "Hampton": [-84.29, 33.38, 11.9],
    "Hapeville": [-84.41, 33.66, 12.1],
    "Holly Springs": [-84.48, 34.17, 11.9],
    "Hoschton": [-83.75, 34.08, 11.9],
    "Johns Creek": [-84.2, 34.04, 11.5],
    "Jonesboro": [-84.35, 33.51, 11.9],
    "Kennesaw": [-84.62, 34.03, 12.0],
    "Lake City": [-84.34, 33.61, 12.1],
    "Lawrenceville": [-84.0, 33.96, 12.0],
    "Lilburn": [-84.12, 33.89, 11.9],
    "Lithonia": [-84.11, 33.71, 12.1],
    "Locust Grove": [-84.11, 33.34, 11.9],
    "Loganville": [-83.88, 33.84, 11.9],
    "Lovejoy": [-84.30, 33.44, 11.9],
    "Mableton": [-84.58, 33.81, 11.4],
    "Marietta": [-84.55, 33.95, 11.5],
    "McDonough": [-84.15, 33.44, 11.9],
    "Milton": [-84.31, 34.14, 11.5],
    "Monroe": [-83.70, 33.80, 11.9],
    "Morrow": [-84.33, 33.58, 11.9],
    "Mount Zion": [-85.18, 33.64, 11.9],
    "Mulberry": [-83.87, 34.06, 11.8],
    "Newnan": [-84.78, 33.38, 11.5],
    "Norcross": [-84.20, 33.94, 12.0],
    "Oakwood": [-83.88, 34.23, 11.9],
    "Oxford": [-83.87, 33.62, 12.0],
    "Palmetto": [-84.65, 33.53, 11.5],
    "Peachtree City": [-84.57, 33.39, 11.5],
    "Peachtree Corners": [-84.22, 33.97, 12.0],
    "Powder Springs": [-84.69, 33.86, 11.8],
    "Riverdale": [-84.40, 33.56, 11.9],
    "Roswell": [-84.35, 34.05, 11.5],
    "Sandy Springs": [-84.37, 33.93, 11.0],
    "Senoia": [-84.55, 33.31, 11.9],
    "Smyrna": [-84.50, 33.85, 11.9],
    "Snellville": [-84.00, 33.86, 12.0],
    "Social Circle": [-83.70, 33.65, 12.0],
    "South Fulton": [-84.55, 33.64, 10.5],
    "Statham": [-83.60, 33.965, 12.0],
    "Stockbridge": [-84.23, 33.53, 11.9],
    "Stonecrest": [-84.12, 33.68, 11.4],
    "Stone Mountain": [-84.17, 33.80, 12.0],
    "Sugar Hill": [-84.05, 34.11, 11.9],
    "Suwanee": [-84.06, 34.06, 11.9],
    "Tucker": [-84.20, 33.85, 12.0],
    "Tyrone": [-84.59, 33.48, 12.0],
    "Union City": [-84.56, 33.58, 11.9],
    "Villa Rica": [-84.92, 33.72, 11.9],
    "Waleska": [-84.55, 34.32, 12.1],
    "Winder": [-83.72, 33.99, 11.9],
    "Woodstock": [-84.52, 34.12, 12.0]
};

/**
 * Get map view configuration based on geography type and selection
 * @param {string} geographyType - The type of geography (Statewide, District, County, City)
 * @param {string} selection - The selected value within that geography type
 * @returns {Array} - [longitude, latitude, zoom] configuration
 */
export function getMapView(geographyType, selection) {
    switch (geographyType) {
        case "Statewide":
            return STATEWIDE_VIEW;
        case "District":
            return DISTRICT_VIEWS[selection] || STATEWIDE_VIEW;
        case "County":
            return COUNTY_VIEWS[selection] || STATEWIDE_VIEW;
        case "City":
            return CITY_VIEWS[selection] || STATEWIDE_VIEW;
        default:
            return STATEWIDE_VIEW;
    }
}

/**
 * Apply the map view configuration to the map
 * @param {object} map - The Mapbox GL map object
 * @param {string} geographyType - The type of geography
 * @param {string} selection - The selected value
 * @param {boolean} animate - Whether to animate the transition (default: true)
 */
export function applyMapView(map, geographyType, selection, animate = true) {
    const [longitude, latitude, zoom] = getMapView(geographyType, selection);

    if (animate) {
        map.flyTo({
            center: [longitude, latitude],
            zoom: zoom,
            essential: true,
            duration: 1500
        });
    } else {
        map.jumpTo({
            center: [longitude, latitude],
            zoom: zoom
        });
    }
} 