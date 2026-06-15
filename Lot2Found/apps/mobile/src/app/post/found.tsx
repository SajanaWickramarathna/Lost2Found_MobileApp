import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Button, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { reverseGeocode } from '@/services/nominatim';
import { useAuth } from '@/context/auth';
import { useLocationSelection } from '@/context/LocationContext';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.83:5000/api';

export default function FoundItemScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { token } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocationSelection();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [images, setImages] = useState<string[]>([]);
  
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState('Fetching location...');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    // Don't auto-fetch location here, wait for user to use the picker
  }, []);

  // Sync selected location from global context
  useEffect(() => {
    if (selectedLocation) {
      setLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      setLocationName(selectedLocation.address);
    }
  }, [selectedLocation]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(data);
      if (data.length > 0) setCategory(data[0]._id);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(a => a.uri);
      setImages([...images, ...newImages].slice(0, 10));
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category || !location) {
      Alert.alert('Error', 'Please fill in all required fields and select a location.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', 'found');
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('locationName', locationName);

      images.forEach((uri, index) => {
        const fileType = uri.substring(uri.lastIndexOf('.') + 1);
        formData.append('images', {
          uri,
          name: `photo${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Item posted successfully!');
        setSelectedLocation(null);
        router.replace('/');
      } else {
        throw new Error(data.message || 'Failed to post item');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText style={styles.label}>Title *</ThemedText>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.backgroundSelected }]}
          value={title}
          onChangeText={setTitle}
          placeholder="E.g. Found Blue Backpack"
          placeholderTextColor={colors.textSecondary}
        />

        <ThemedText style={styles.label}>Description *</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.backgroundSelected }]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Details about the item..."
          placeholderTextColor={colors.textSecondary}
        />

        <ThemedText style={styles.label}>Category *</ThemedText>
        <View style={[styles.pickerContainer, { borderColor: colors.backgroundSelected }]}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.text}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
            ))}
          </Picker>
        </View>

        <ThemedText style={styles.label}>Images ({images.length}/10)</ThemedText>
        <View style={styles.imagesRow}>
          {images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.thumbnail} />
          ))}
          {images.length < 10 && (
            <TouchableOpacity style={[styles.addPhoto, { borderColor: colors.textSecondary }]} onPress={pickImages}>
              <ThemedText style={{ color: colors.textSecondary }}>+ Add</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <ThemedText style={styles.label}>Location *</ThemedText>
        <TouchableOpacity 
          style={[styles.locationButton, { borderColor: colors.backgroundSelected }]} 
          onPress={() => router.push('/location-picker')}
        >
          <ThemedText style={{ color: location ? colors.text : colors.textSecondary }}>
            {location ? locationName : 'Select location from map'}
          </ThemedText>
          <ThemedText style={{ color: '#0a7ea4', marginTop: 4 }}>Tap to open map ➔</ThemedText>
        </TouchableOpacity>

        <View style={styles.submitBtn}>
          <Button title={loading ? "Posting..." : "Post Found Item"} onPress={handleSubmit} disabled={loading} color="#4ECDC4" />
        </View>
        
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.four,
    paddingBottom: Spacing.six * 2,
  },
  title: {
    marginBottom: Spacing.four,
    textAlign: 'center',
    color: '#4ECDC4',
  },
  label: {
    fontWeight: 'bold',
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    backgroundColor: 'transparent',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: Spacing.one,
  },
  addPhoto: {
    width: 70,
    height: 70,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.one,
    backgroundColor: 'transparent',
    alignItems: 'flex-start',
  },
  submitBtn: {
    marginTop: Spacing.six,
  }
});
