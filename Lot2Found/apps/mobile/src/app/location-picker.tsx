import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Keyboard, Platform, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { UrlTile, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { reverseGeocode, forwardGeocode, searchLocations, LocationSuggestion } from '@/services/nominatim';
import { useLocationSelection } from '@/context/LocationContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

  const regionChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    
    if (regionChangeTimeout.current) {
      clearTimeout(regionChangeTimeout.current);
    }

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
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Top Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <Input
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(true);
              }}
              placeholder="Search for a place..."
              onFocus={() => setShowSuggestions(true)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          {isSearching && <ActivityIndicator size="small" color={colors.tint} style={{ marginLeft: Spacing.two }} />}
        </View>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.backgroundElement, shadowColor: '#000' }]}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]} 
                  onPress={() => handleSuggestionPress(item)}
                >
                  <MaterialIcons name="location-on" size={20} color={colors.textSecondary} style={{ marginRight: Spacing.two }} />
                  <ThemedText numberOfLines={2} style={{ flex: 1 }}>{item.displayName}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Map View */}
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
              <View style={[styles.markerDot, { backgroundColor: colors.tint, borderColor: colors.background }]} />
              <View style={[styles.markerLine, { backgroundColor: colors.text }]} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        )}

        {/* Bottom Confirmation Box */}
        <View style={[styles.bottomContainer, { backgroundColor: colors.background, shadowColor: '#000' }]}>
          <ThemedText style={styles.addressLabel}>Selected Location:</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four }}>
            {isGeocoding ? (
              <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginRight: Spacing.two }} />
            ) : <MaterialIcons name="location-on" size={20} color={colors.tint} style={{ marginRight: Spacing.two }} />}
            <ThemedText style={styles.addressText} numberOfLines={2}>
              {address}
            </ThemedText>
          </View>

          <Button 
            title="Confirm Location"
            onPress={handleConfirm}
            disabled={isGeocoding || !region}
            size="large"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: Spacing.three,
    alignItems: 'center',
    zIndex: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.two,
    marginRight: Spacing.one,
  },
  searchInputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  searchInput: {
    marginBottom: 0, // Override Input component margin
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 70, // Below search container
    left: Spacing.four,
    right: Spacing.four,
    maxHeight: 200,
    borderRadius: Spacing.two,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
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
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerLine: {
    width: 2,
    height: 20,
  },
  bottomContainer: {
    padding: Spacing.six,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    marginTop: -20, // Overlap the map slightly
    elevation: 10,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 10,
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: Spacing.one,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
