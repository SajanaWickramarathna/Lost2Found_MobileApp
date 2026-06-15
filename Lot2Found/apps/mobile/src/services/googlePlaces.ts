// Google Places API (New) integration
// https://developers.google.com/maps/documentation/places/web-service/op-overview

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const BASE_URL = 'https://places.googleapis.com/v1';

export interface GoogleLocationSuggestion {
  placeId: string;
  displayName: string;
}

/**
 * Autocomplete search using Google Places API (New)
 * Restricted to Sri Lanka ("LK")
 */
export async function searchGoogleLocations(query: string): Promise<GoogleLocationSuggestion[]> {
  if (!API_KEY || API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
    console.warn('Google Maps API Key is missing. Please add it to .env');
    return [];
  }

  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ['LK'], // Restrict to Sri Lanka
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Places Autocomplete Error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    
    if (data.suggestions && data.suggestions.length > 0) {
      return data.suggestions
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          placeId: s.placePrediction.placeId,
          displayName: s.placePrediction.text.text,
        }));
    }
    
    return [];
  } catch (error) {
    console.error('Failed to search Google Locations:', error);
    return [];
  }
}

/**
 * Get place details (specifically location coordinates) from a placeId
 */
export async function getPlaceDetails(placeId: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!API_KEY || API_KEY === 'YOUR_GOOGLE_API_KEY_HERE') {
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'location', // Only request the location field to save bandwidth/costs
      },
    });

    if (!response.ok) {
      console.error('Google Place Details Error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.location) {
      return {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get Google Place Details:', error);
    return null;
  }
}
