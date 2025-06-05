// Maps geography types to their corresponding geojson files.
const GEOGRAPHY_FILE_PATHS = {
  Statewide: "../../data/statewide/stateGA.geojson",
  County: "../../data/counties/ATL_counties.geojson",
  City: "../../data/cities/ATL_cities.geojson",
  District: "../../data/congressional_districts/cdistricts.geojson",
};

// Maps geography types to their corresponding label (centroid) geojson files
const GEOGRAPHY_LABEL_FILE_PATHS = {
  District: "../../data/congressional_districts/cdistricts_centroids.geojson",
  County: "../../data/counties/ATL_counties_labels.geojson",
};

// Import getBoundaryStyle from ThemeManager 
import { getBoundaryStyle } from './ThemeManager.js';
// Import map view configuration functions
import { applyMapView } from './MapViewConfig.js';

// Loads boundary GeoJSON data based on the selected geography type
export async function loadBoundaryGeoJSON(geographyType) {
  const filePath = GEOGRAPHY_FILE_PATHS[geographyType];

  if (!filePath) {
    throw new Error(`Invalid geography type: ${geographyType}`);
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch geojson: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading geojson for ${geographyType}:`, error);
    throw error;
  }
}

// Loads label (centroid) GeoJSON data for Districts and Counties
export async function loadLabelGeoJSON(geographyType) {
  // Only load labels for District and County
  if (geographyType !== "District" && geographyType !== "County") {
    return null;
  }

  const filePath = GEOGRAPHY_LABEL_FILE_PATHS[geographyType];
  if (!filePath) {
    return null;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch label geojson: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading label geojson for ${geographyType}:`, error);
    return null;
  }
}

// Helper function to check if a feature matches the selected value
function isFeatureSelected(feature, selectedValue, geographyType) {
  if (!feature.properties) return false;

  switch (geographyType) {
    case "District":
      const districtNumber = parseInt(selectedValue, 10);
      return feature.properties.DISTRICT === districtNumber;

    case "County":
      return (
        feature.properties.NAME === selectedValue ||
        feature.properties.name === selectedValue ||
        feature.properties.Name === selectedValue ||
        feature.properties.COUNTY === selectedValue ||
        feature.properties.county === selectedValue ||
        feature.properties.County === selectedValue
      );

    case "City":
      return (
        feature.properties.NAME === selectedValue ||
        feature.properties.name === selectedValue ||
        feature.properties.Name === selectedValue ||
        feature.properties.CITY === selectedValue ||
        feature.properties.city === selectedValue ||
        feature.properties.City === selectedValue
      );

    default:
      return false;
  }
}

// Updates the map with boundary layer based on the selected geography type
export async function updateBoundaryLayer(map, geographyType) {
  const sourceId = "boundary-source";
  const selectedLayerId = "selected-boundary";
  const unselectedLayerId = "unselected-boundary";
  const selectedOutlineLayerId = "selected-boundary-outline";
  const unselectedOutlineLayerId = "unselected-boundary-outline";
  const labelSourceId = "label-source";
  const labelLayerId = "boundary-labels";

  // Get the current dropdown selection value
  const geoDropdownSelect = document.getElementById("geoDropdownSelect");
  let selectedValue = null;
  if (geoDropdownSelect) {
    selectedValue = geoDropdownSelect.value;
    // Replace underscores with spaces to handle Shoelace's conversion
    if (typeof selectedValue === 'string' && selectedValue.includes('_')) {
      selectedValue = selectedValue.replace(/_/g, ' ');
    }
    console.log(`Selected ${geographyType} value:`, selectedValue);
  }

  try {
    // Load the GeoJSON data for the selected geography type
    let boundaryData = await loadBoundaryGeoJSON(geographyType);

    // Log the structure of the first feature to understand property names
    if (boundaryData.features && boundaryData.features.length > 0) {
      console.log(`Sample feature properties for ${geographyType}:`,
        boundaryData.features[0].properties);
    }

    // Wait for the map to be loaded
    if (!map.loaded()) {
      await new Promise((resolve) => map.once("load", resolve));
    }

    // Remove existing layers and source if they exist
    const layersToRemove = [
      selectedOutlineLayerId,
      unselectedOutlineLayerId,
      selectedLayerId,
      unselectedLayerId,
      labelLayerId
    ];

    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    if (map.getSource(labelSourceId)) {
      map.removeSource(labelSourceId);
    }

    // For City geography type, filter to only show the selected city
    if (geographyType === "City" && selectedValue) {
      // Filter the features to only include the selected city
      boundaryData.features = boundaryData.features.filter(feature =>
        isFeatureSelected(feature, selectedValue, geographyType)
      );

      // Mark the selected feature
      if (boundaryData.features.length > 0) {
        boundaryData.features[0].properties.isSelected = true;
      }
    } else {
      // For other geography types, mark selected features
      if (selectedValue && geographyType !== "Statewide") {
        boundaryData.features.forEach(feature => {
          feature.properties.isSelected = isFeatureSelected(feature, selectedValue, geographyType);
        });
      }
    }

    // Add the new source with all features
    map.addSource(sourceId, {
      type: "geojson",
      data: boundaryData,
    });

    // Get the style for the selected geography type from ThemeManager
    const style = getBoundaryStyle(geographyType);

    // Add the unselected features layer with transparent fill and thin black outline
    map.addLayer({
      id: unselectedLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#000000",
        "fill-opacity": 0
      },
      filter: ["!=", ["get", "isSelected"], true]
    });

    // Add the selected feature layer with light grey fill
    map.addLayer({
      id: selectedLayerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#808080",
        "fill-opacity": 0.3
      },
      filter: ["==", ["get", "isSelected"], true]
    });

    // Add the unselected features outline
    map.addLayer({
      id: unselectedOutlineLayerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": style["line-color"],
        "line-width": 1
      },
      filter: ["!=", ["get", "isSelected"], true]
    });

    // Add the selected feature outline (slightly thicker)
    map.addLayer({
      id: selectedOutlineLayerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": style["line-color"],
        "line-width": 2
      },
      filter: ["==", ["get", "isSelected"], true]
    });

    // Add label layer if geography type is District or County
    if (geographyType === "District" || geographyType === "County") {
      try {
        const labelData = await loadLabelGeoJSON(geographyType);

        if (labelData) {
          // Add label source
          map.addSource(labelSourceId, {
            type: "geojson",
            data: labelData
          });

          // Add label layer
          map.addLayer({
            id: labelLayerId,
            type: "symbol",
            source: labelSourceId,
            layout: {
              "text-field": geographyType === "District" ?
                ["concat", "District ", ["to-string", ["get", "DISTRICT"]]] :
                ["format",
                  ["upcase", ["get", "ShortLabel"]],
                  { "font-scale": 0.8, "text-font": ["Roboto Bold Italic", "Arial Unicode MS Bold"] }
                ],
              "text-font": ["Roboto Bold", "Arial Unicode MS Bold"],
              "text-size": 16,
              "text-allow-overlap": false,
              "text-ignore-placement": false,
            },
            paint: {
              "text-color": "#000000",
              "text-halo-color": "#ffffff",
              "text-halo-width": 2
            }
          });
        }
      } catch (error) {
        console.error(`Error adding label layer for ${geographyType}:`, error);
      }
    }

    // Apply the appropriate map view based on geography type and selection
    applyMapView(map, geographyType, selectedValue);

    return boundaryData;
  } catch (error) {
    console.error(`Error updating boundary layer for ${geographyType}:`, error);
    throw error;
  }
}

// Sets up an event listener for the geography selection radio buttons
export function setupGeographyRadioListener(map) {
  const geographySelect = document.getElementById("geographySelect");
  if (!geographySelect) {
    console.error("Geography select element not found");
    return;
  }

  // Get reference to the jurisdiction dropdown
  const geoDropdownSelect = document.getElementById("geoDropdownSelect");
  if (!geoDropdownSelect) {
    console.error("Jurisdiction dropdown element not found");
    return;
  }

  // Set initial boundary based on default selection
  const initialGeography = geographySelect.value || "District";

  // Wait for the map to be loaded before setting up the initial boundary
  if (map.loaded()) {
    updateJurisdictionDropdown(initialGeography, geoDropdownSelect);
    updateBoundaryLayer(map, initialGeography);
  } else {
    map.on("load", () => {
      updateJurisdictionDropdown(initialGeography, geoDropdownSelect);
      updateBoundaryLayer(map, initialGeography);
    });
  }

  // Set up event listener for changes to the geography selection
  geographySelect.addEventListener("sl-change", (event) => {
    const selectedGeography = event.target.value;

    if (selectedGeography === "Statewide") {
      geoDropdownSelect.disabled = true;
      // Apply statewide view immediately
      applyMapView(map, "Statewide", null);
    } else {
      geoDropdownSelect.disabled = false;
    }
    updateJurisdictionDropdown(selectedGeography, geoDropdownSelect);
    updateBoundaryLayer(map, selectedGeography);
  });

  // Add event listener for changes to the dropdown selection
  geoDropdownSelect.addEventListener("sl-change", (event) => {
    // Get the current geography type
    const currentGeography = geographySelect.value;

    // Update the boundary layer when dropdown selection changes
    updateBoundaryLayer(map, currentGeography);
  });
}

// Updates the jurisdiction dropdown based on the selected geography
function updateJurisdictionDropdown(selectedGeography, geoDropdownSelect) {
  // Update the label based on geography selection
  switch (selectedGeography) {
    case "City":
      geoDropdownSelect.label = "By City:";
      break;
    case "County":
      geoDropdownSelect.label = "By County:";
      break;
    case "District":
      geoDropdownSelect.label = "By Congressional District:";
      break;
    case "Statewide":
      geoDropdownSelect.label = "Statewide";
  }

  // Clear existing options
  while (geoDropdownSelect.firstChild) {
    geoDropdownSelect.removeChild(geoDropdownSelect.firstChild);
  }

  // Add options based on geography type
  if (selectedGeography === "City") {
    const cities = [
      { name: "Acworth", value: "Acworth" },
      { name: "Alpharetta", value: "Alpharetta" },
      { name: "Atlanta", value: "Atlanta" },
      { name: "Auburn", value: "Auburn" },
      { name: "Austell", value: "Austell" },
      { name: "Avondale Estates", value: "Avondale_Estates" },
      { name: "Ball Ground", value: "Ball_Ground" },
      { name: "Berkeley Lake", value: "Berkeley_Lake" },
      { name: "Braselton", value: "Braselton" },
      { name: "Brookhaven", value: "Brookhaven" },
      { name: "Brooks", value: "Brooks" },
      { name: "Buford", value: "Buford" },
      { name: "Canton", value: "Canton" },
      { name: "Carrollton", value: "Carrollton" },
      { name: "Cartersville", value: "Cartersville" },
      { name: "Chamblee", value: "Chamblee" },
      { name: "Chattahoochee Hills", value: "Chattahoochee_Hills" },
      { name: "Clarkston", value: "Clarkston" },
      { name: "Clermont", value: "Clermont" },
      { name: "College Park", value: "College_Park" },
      { name: "Conyers", value: "Conyers" },
      { name: "Covington", value: "Covington" },
      { name: "Cumming", value: "Cumming" },
      { name: "Dacula", value: "Dacula" },
      { name: "Dallas", value: "Dallas" },
      { name: "Dawsonville", value: "Dawsonville" },
      { name: "Decatur", value: "Decatur" },
      { name: "Doraville", value: "Doraville" },
      { name: "Douglasville", value: "Douglasville" },
      { name: "Duluth", value: "Duluth" },
      { name: "Dunwoody", value: "Dunwoody" },
      { name: "East Point", value: "East_Point" },
      { name: "Emerson", value: "Emerson" },
      { name: "Fairburn", value: "Fairburn" },
      { name: "Fayetteville", value: "Fayetteville" },
      { name: "Flowery Branch", value: "Flowery_Branch" },
      { name: "Forest Park", value: "Forest_Park" },
      { name: "Gainesville", value: "Gainesville" },
      { name: "Grayson", value: "Grayson" },
      { name: "Griffin", value: "Griffin" },
      { name: "Hampton", value: "Hampton" },
      { name: "Hapeville", value: "Hapeville" },
      { name: "Holly Springs", value: "Holly_Springs" },
      { name: "Hoschton", value: "Hoschton" },
      { name: "Johns Creek", value: "Johns_Creek" },
      { name: "Jonesboro", value: "Jonesboro" },
      { name: "Kennesaw", value: "Kennesaw" },
      { name: "Lake City", value: "Lake_City" },
      { name: "Lawrenceville", value: "Lawrenceville" },
      { name: "Lithonia", value: "Lithonia" },
      { name: "Locust Grove", value: "Locust_Grove" },
      { name: "Loganville", value: "Loganville" },
      { name: "Lovejoy", value: "Lovejoy" },
      { name: "Lilburn", value: "Lilburn" },
      { name: "Mableton", value: "Mableton" },
      { name: "Marietta", value: "Marietta" },
      { name: "McDonough", value: "McDonough" },
      { name: "Milton", value: "Milton" },
      { name: "Monroe", value: "Monroe" },
      { name: "Morrow", value: "Morrow" },
      { name: "Mount Zion", value: "Mount_Zion" },
      { name: "Mulberry", value: "Mulberry" },
      { name: "Newnan", value: "Newnan" },
      { name: "Norcross", value: "Norcross" },
      { name: "Oakwood", value: "Oakwood" },
      { name: "Oxford", value: "Oxford" },
      { name: "Palmetto", value: "Palmetto" },
      { name: "Peachtree City", value: "Peachtree_City" },
      { name: "Peachtree Corners", value: "Peachtree_Corners" },
      { name: "Powder Springs", value: "Powder_Springs" },
      { name: "Riverdale", value: "Riverdale" },
      { name: "Roswell", value: "Roswell" },
      { name: "Sandy Springs", value: "Sandy_Springs" },
      { name: "Senoia", value: "Senoia" },
      { name: "Smyrna", value: "Smyrna" },
      { name: "Snellville", value: "Snellville" },
      { name: "Social Circle", value: "Social_Circle" },
      { name: "South Fulton", value: "South_Fulton" },
      { name: "Statham", value: "Statham" },
      { name: "Stockbridge", value: "Stockbridge" },
      { name: "Stonecrest", value: "Stonecrest" },
      { name: "Stone Mountain", value: "Stone_Mountain" },
      { name: "Sugar Hill", value: "Sugar_Hill" },
      { name: "Suwanee", value: "Suwanee" },
      { name: "Tucker", value: "Tucker" },
      { name: "Tyrone", value: "Tyrone" },
      { name: "Union City", value: "Union_City" },
      { name: "Villa Rica", value: "Villa_Rica" },
      { name: "Waleska", value: "Waleska" },
      { name: "Winder", value: "Winder" },
      { name: "Woodstock", value: "Woodstock" },
    ];

    cities.forEach((city) => {
      const option = document.createElement("sl-option");
      option.value = city.value;
      option.textContent = city.name;
      geoDropdownSelect.appendChild(option);
    });

    // Set default city selection
    if (cities.length > 0) {
      geoDropdownSelect.value = cities[2].value;
    }
  } else if (selectedGeography === "County") {
    const counties = [
      { name: "Barrow", value: "Barrow" },
      { name: "Bartow", value: "Bartow" },
      { name: "Carroll", value: "Carroll" },
      { name: "Cherokee", value: "Cherokee" },
      { name: "Clayton", value: "Clayton" },
      { name: "Cobb", value: "Cobb" },
      { name: "Coweta", value: "Coweta" },
      { name: "Dawson", value: "Dawson" },
      { name: "DeKalb", value: "DeKalb" },
      { name: "Douglas", value: "Douglas" },
      { name: "Fayette", value: "Fayette" },
      { name: "Forsyth", value: "Forsyth" },
      { name: "Fulton", value: "Fulton" },
      { name: "Gwinnett", value: "Gwinnett" },
      { name: "Hall", value: "Hall" },
      { name: "Henry", value: "Henry" },
      { name: "Newton", value: "Newton" },
      { name: "Paulding", value: "Paulding" },
      { name: "Rockdale", value: "Rockdale" },
      { name: "Spalding", value: "Spalding" },
      { name: "Walton", value: "Walton" },
    ];
    counties.forEach((county) => {
      const option = document.createElement("sl-option");
      option.value = county.value;
      option.textContent = county.name;
      geoDropdownSelect.appendChild(option);
    });

    // Set default county selection
    if (counties.length > 0) {
      geoDropdownSelect.value = counties[12].value; // Fulton
    }
  } else if (selectedGeography === "District") {
    // Create options for districts 1-14
    for (let i = 1; i <= 14; i++) {
      const option = document.createElement("sl-option");
      option.value = i.toString();
      option.textContent = i.toString();
      geoDropdownSelect.appendChild(option);
    }

    // Set default selection 
    geoDropdownSelect.value = "4";
  }
}
