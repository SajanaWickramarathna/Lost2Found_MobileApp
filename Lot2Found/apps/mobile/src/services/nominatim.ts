// Nominatim API for OpenStreetMap Geocoding
// https://nominatim.org/release-docs/develop/api/Search/

const BASE_URL = 'https://nominatim.openstreetmap.org';

// OpenStreetMap requires a valid User-Agent identifying the app
const HEADERS = {
  'User-Agent': 'Lost2FoundApp/1.0',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Reverse geocode: Coordinates -> Address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `${BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      { headers: HEADERS }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.display_name) {
      // Simplify the display name (Nominatim results can be very long)
      const parts = data.display_name.split(', ');
      // Take up to the first 3 parts (usually building/street, city, state)
      return parts.slice(0, 3).join(', ');
    }
    return 'Unknown Location';
  } catch (error) {
    console.error('Reverse Geocoding Error:', error);
    return 'Location not found (Rate limited)';
  }
}

/**
 * Forward geocode: Address -> Coordinates
 */
export async function forwardGeocode(query: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=lk`,
      { headers: HEADERS }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Forward Geocoding Error:', error);
    return null;
  }
}

/**
 * Search locations for autocomplete recommendations
 */
export interface LocationSuggestion {
  displayName: string;
  latitude: number;
  longitude: number;
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  try {
    // We append " Sri Lanka" to help the Photon search engine prioritize local results,
    // since Photon does not have a strict countrycode filter like Nominatim.
    const searchQuery = `${query} Sri Lanka`;
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=15`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data && data.features && data.features.length > 0) {
      // Filter strictly for Sri Lanka just to be safe, then format
      const sriLankaResults = data.features.filter((item: any) => 
        item.properties.countrycode === 'LK' || item.properties.country === 'Sri Lanka'
      );
      
      return sriLankaResults.slice(0, 5).map((item: any) => {
        const props = item.properties;
        // Build a readable display name from available properties
        const nameParts = [props.name, props.street, props.city, props.state].filter(Boolean);
        // Remove duplicates and join
        const displayName = Array.from(new Set(nameParts)).join(', ');
        
        return {
          displayName: displayName || 'Unknown Location',
          latitude: item.geometry.coordinates[1], // Photon uses [lon, lat]
          longitude: item.geometry.coordinates[0],
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Search Locations Error:', error);
    return [];
  }
}
