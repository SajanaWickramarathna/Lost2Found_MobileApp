import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TextInput, View, Button, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

type Category = {
  _id: string;
  name: string;
  icon: string;
  description: string;
};

// Hardcoding local IP explicitly to prevent Expo .env caching issues (matches auth context)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.83:5000/api';

export default function AdminDashboardScreen() {
  const { token, user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId('');
    setName('');
    setIcon('');
    setDescription('');
  };

  const handleSave = async () => {
    if (!name || !icon || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const endpoint = isEditing ? `${API_URL}/admin/categories/${currentId}` : `${API_URL}/admin/categories`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, icon, description }),
      });

      if (res.ok) {
        Alert.alert('Success', `Category ${isEditing ? 'updated' : 'added'} successfully`);
        resetForm();
        fetchCategories();
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Something went wrong');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleEditClick = (category: Category) => {
    setIsEditing(true);
    setCurrentId(category._id);
    setName(category.name);
    setIcon(category.icon);
    setDescription(category.description);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin/categories/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              fetchCategories();
            } else {
              Alert.alert('Error', 'Failed to delete category');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  if (user?.role !== 'admin') {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Access Denied. Admins only.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Admin Dashboard</ThemedText>

      {/* Admin Form */}
      <View style={styles.formContainer}>
        <ThemedText type="subtitle">{isEditing ? 'Edit Category' : 'Add Category'}</ThemedText>
        <TextInput style={styles.input} placeholder="Name (e.g. Phone)" placeholderTextColor="#888" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Icon name (e.g. smartphone)" placeholderTextColor="#888" value={icon} onChangeText={setIcon} />
        <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#888" value={description} onChangeText={setDescription} />
        
        <View style={styles.buttonRow}>
          <Button title={isEditing ? 'Update' : 'Save'} onPress={handleSave} />
          {isEditing && <Button title="Cancel" onPress={resetForm} color="red" />}
        </View>
      </View>

      {/* Category List */}
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name={item.icon as any} size={24} color="#0a7ea4" />
                <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
              </View>
              <ThemedText style={styles.cardDesc}>{item.description}</ThemedText>
              <View style={styles.cardActions}>
                <Button title="Edit" onPress={() => handleEditClick(item)} />
                <Button title="Delete" color="red" onPress={() => handleDelete(item._id)} />
              </View>
            </View>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.four,
  },
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.four,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    marginTop: Spacing.two,
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    marginLeft: Spacing.two,
    fontWeight: 'bold',
    fontSize: 18,
  },
  cardDesc: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    color: '#aaa',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
