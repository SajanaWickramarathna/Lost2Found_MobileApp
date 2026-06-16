import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/context/auth';
import { useLocationSelection } from '@/context/LocationContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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
  }, []);

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
    <ScreenWrapper scrollable keyboardOffset={100}>
      <View style={styles.container}>
        <ThemedText type="title" style={[styles.title, { color: colors.success }]}>Report Found Item</ThemedText>
        <ThemedText style={styles.subtitle}>Please provide details to help return it to its owner.</ThemedText>

        <Card elevated={false} style={styles.formCard}>
          <Input
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="E.g. Found Blue Backpack"
          />

          <Input
            label="Description *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
            placeholder="Details about the item..."
          />

          <ThemedText style={styles.label}>Category *</ThemedText>
          <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
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
                <ThemedText style={{ color: colors.textSecondary, fontSize: 24 }}>+</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <ThemedText style={[styles.label, { marginTop: Spacing.four }]}>Location *</ThemedText>
          <TouchableOpacity 
            style={[styles.locationButton, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]} 
            onPress={() => router.push('/location-picker')}
          >
            <ThemedText style={{ color: location ? colors.text : colors.textSecondary, flex: 1 }} numberOfLines={1}>
              {location ? locationName : 'Select location from map'}
            </ThemedText>
            <View style={[styles.mapIcon, { backgroundColor: colors.success }]}>
              <ThemedText style={{ color: '#fff', fontSize: 12 }}>Map</ThemedText>
            </View>
          </TouchableOpacity>
        </Card>

        <View style={styles.submitBtn}>
          <Button 
            title="Post Found Item" 
            onPress={handleSubmit} 
            loading={loading} 
            size="large"
            style={{ backgroundColor: colors.success }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.four,
    opacity: 0.7,
  },
  formCard: {
    padding: Spacing.four,
    marginBottom: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.one,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: Spacing.two,
  },
  addPhoto: {
    width: 70,
    height: 70,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.one,
  },
  mapIcon: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  submitBtn: {
    marginTop: Spacing.two,
    marginBottom: Spacing.six,
  }
});
