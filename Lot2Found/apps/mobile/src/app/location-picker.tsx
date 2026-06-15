import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Keyboard, Platform, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { UrlTile, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { reverseGeocode, forwardGeocode, searchLocations, LocationSuggestion } from '@/services/nominatim';
import { useLocationSelection } from '@/context/LocationContext';

export default function LocationPickerScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { setSelectedLocation } = useLocationSelection();

  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState('Locating...');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2 && showSuggestions) {
      const timeoutId = setTimeout(async () => {
        const results = await searchLocations(searchQuery);
        setSuggestions(results);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, showSuggestions]);

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setAddress('Permission denied. Drag map to select.');
      // Default to Colombo, Sri Lanka
      setRegion({
        latitude: 6.9271,
        longitude: 79.8612,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    const initialRegion = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(initialRegion);
    updateAddress(initialRegion.latitude, initialRegion.longitude);
  };

  const updateAddress = async (lat: number, lon: number) => {
    setIsGeocoding(true);
    const addr = await reverseGeocode(lat, lon);
    setAddress(addr);
    setIsGeocoding(false);
  };

  const regionChangeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    
    // Clear the previous timeout if it exists
    if (regionChangeTimeout.current) {
      clearTimeout(regionChangeTimeout.current);
    }

    // Set a new timeout to update the address after 1 second of inactivity to avoid rate limiting
    regionChangeTimeout.current = setTimeout(() => {
      updateAddress(newRegion.latitude, newRegion.longitude);
    }, 1000);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    const coords = await forwardGeocode(searchQuery);
    setIsSearching(false);

    if (coords) {
      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      updateAddress(coords.latitude, coords.longitude);
    } else {
      alert('Location not found');
    }
  };

  const handleSuggestionPress = async (suggestion: LocationSuggestion) => {
    Keyboard.dismiss();
    setSearchQuery(suggestion.displayName);
    setShowSuggestions(false);
    
    const newRegion = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
    updateAddress(suggestion.latitude, suggestion.longitude);
  };

  const handleConfirm = () => {
    if (region) {
      setSelectedLocation({
        latitude: region.latitude,
        longitude: region.longitude,
        address: address,
      });
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={{fontSize: 24, lineHeight: 24}}>×</ThemedText>
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.backgroundElement }]}
          placeholder="Search for a place..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {isSearching && <ActivityIndicator size="small" color="#0a7ea4" style={{marginLeft: 10}}/>}
      </View>

      {/* Autocomplete Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.background }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.suggestionItem, { borderBottomColor: colors.backgroundElement }]} 
                onPress={() => handleSuggestionPress(item)}
              >
                <ThemedText numberOfLines={2}>{item.displayName}</ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Map View */}
      {Platform.OS === 'web' ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
           <ThemedText>Maps are not supported on web in this boilerplate. Use a real device.</ThemedText>
        </View>
      ) : region ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
          >
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
          </MapView>
          
          {/* Fixed center marker (Uber style) */}
          <View style={styles.markerFixed} pointerEvents="none">
            <View style={styles.markerDot} />
            <View style={styles.markerLine} />
          </View>
        </View>
      ) : (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      )}

      {/* Bottom Confirmation Box */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.addressLabel}>Selected Location:</ThemedText>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
          {isGeocoding ? (
            <ActivityIndicator size="small" color={colors.textSecondary} style={{marginRight: 8}}/>
          ) : null}
          <ThemedText style={styles.addressText} numberOfLines={2}>
            {address}
          </ThemedText>
        </View>

        <TouchableOpacity 
          style={[styles.confirmButton, { backgroundColor: '#0a7ea4' }]} 
          onPress={handleConfirm}
          disabled={isGeocoding || !region}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70, // Below search container
    left: 16,
    right: 16,
    maxHeight: 200,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 20,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -40,
    alignItems: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a7ea4',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerLine: {
    width: 2,
    height: 20,
    backgroundColor: '#333',
  },
  bottomContainer: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20, // Overlap the map slightly
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  confirmButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
