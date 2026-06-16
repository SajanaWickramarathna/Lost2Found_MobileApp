import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, TextInput, View, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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

type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: string;
  lockUntil?: string;
};

// Hardcoding local IP explicitly to prevent Expo .env caching issues (matches auth context)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.83:5000/api';

export default function AdminDashboardScreen() {
  const { token, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'categories' | 'users'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategories();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data);
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

  const handleDeleteCategory = async (id: string) => {
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

  const submitBan = async (id: string, durationDays: number) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ durationDays })
      });
      if (res.ok) {
        Alert.alert('Success', `User banned for ${durationDays} days`);
        fetchUsers();
      } else {
        Alert.alert('Error', 'Failed to ban user');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleBanUser = (id: string) => {
    Alert.alert('Ban User', 'Select ban duration:', [
      { text: '1 Day', onPress: () => submitBan(id, 1) },
      { text: '7 Days', onPress: () => submitBan(id, 7) },
      { text: '30 Days', onPress: () => submitBan(id, 30) },
      { text: 'Permanent', onPress: () => submitBan(id, 36500) },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleUnbanUser = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}/unban`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        Alert.alert('Success', 'User unbanned');
        fetchUsers();
      } else {
        Alert.alert('Error', 'Failed to unban user');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteUser = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to completely remove this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              fetchUsers();
            } else {
              Alert.alert('Error', 'Failed to delete user');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  if (user?.role !== 'admin') {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Access Denied. Admins only.</ThemedText>
      </ThemedView>
    );
  }

  const renderCategories = () => (
    <>
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
                <Button title="Delete" color="red" onPress={() => handleDeleteCategory(item._id)} />
              </View>
            </View>
          )}
        />
      )}
    </>
  );

  const renderUsers = () => (
    <>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={usersList}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isBanned = item.lockUntil && new Date(item.lockUntil).getTime() > Date.now();
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="person" size={24} color={isBanned ? 'red' : '#0a7ea4'} />
                  <ThemedText style={[styles.cardTitle, isBanned && { color: 'red' }]}>{item.name}</ThemedText>
                </View>
                <ThemedText style={styles.cardDesc}>{item.email}</ThemedText>
                <ThemedText style={styles.cardDesc}>Role: {item.role}</ThemedText>
                <ThemedText style={[styles.cardDesc, isBanned ? { color: 'red' } : { color: 'green' }]}>
                  Status: {isBanned ? `Banned until ${new Date(item.lockUntil!).toLocaleDateString()}` : 'Active'}
                </ThemedText>
                <View style={styles.cardActions}>
                  {isBanned ? (
                    <Button title="Unban" color="green" onPress={() => handleUnbanUser(item._id)} />
                  ) : (
                    <Button title="Ban" color="orange" onPress={() => handleBanUser(item._id)} />
                  )}
                  <Button title="Remove" color="red" onPress={() => handleDeleteUser(item._id)} />
                </View>
              </View>
            );
          }}
        />
      )}
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Admin Dashboard</ThemedText>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <ThemedText style={activeTab === 'categories' ? styles.activeTabText : styles.tabText}>Categories</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <ThemedText style={activeTab === 'users' ? styles.activeTabText : styles.tabText}>Users</ThemedText>
        </TouchableOpacity>
      </View>

      {activeTab === 'categories' ? renderCategories() : renderUsers()}
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    backgroundColor: '#222',
  },
  activeTab: {
    backgroundColor: '#0a7ea4',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
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
    marginBottom: Spacing.one,
    color: '#aaa',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});
