import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing, Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.83:5000/api';

export default function AdminDashboardScreen() {
  const { token, user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  
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
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ThemedText style={{ color: colors.error, fontSize: 18, fontWeight: 'bold' }}>Access Denied. Admins only.</ThemedText>
        </View>
      </ScreenWrapper>
    );
  }

  const renderCategories = () => (
    <>
      <Card style={styles.formContainer}>
        <ThemedText type="subtitle" style={{ marginBottom: Spacing.two }}>{isEditing ? 'Edit Category' : 'Add Category'}</ThemedText>
        <Input placeholder="Name (e.g. Phone)" value={name} onChangeText={setName} />
        <Input placeholder="Icon name (e.g. smartphone)" value={icon} onChangeText={setIcon} />
        <Input placeholder="Description" value={description} onChangeText={setDescription} />
        
        <View style={styles.buttonRow}>
          <Button title={isEditing ? 'Update' : 'Save'} onPress={handleSave} style={{ flex: 1, marginRight: isEditing ? Spacing.two : 0 }} />
          {isEditing && <Button title="Cancel" onPress={resetForm} variant="outline" style={{ flex: 1 }} />}
        </View>
      </Card>

      {loading ? (
        <ActivityIndicator size="large" color={colors.tint} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.listItem}>
              <View style={styles.cardHeader}>
                <MaterialIcons name={item.icon as any} size={24} color={colors.tint} />
                <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
              </View>
              <ThemedText style={styles.cardDesc}>{item.description}</ThemedText>
              <View style={styles.cardActions}>
                <Button title="Edit" size="small" variant="secondary" onPress={() => handleEditClick(item)} />
                <Button title="Delete" size="small" variant="outline" onPress={() => handleDeleteCategory(item._id)} />
              </View>
            </Card>
          )}
        />
      )}
    </>
  );

  const renderUsers = () => (
    <>
      {loading ? (
        <ActivityIndicator size="large" color={colors.tint} />
      ) : (
        <FlatList
          data={usersList}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isBanned = item.lockUntil && new Date(item.lockUntil).getTime() > Date.now();
            return (
              <Card style={styles.listItem}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="person" size={24} color={isBanned ? colors.error : colors.tint} />
                  <ThemedText style={[styles.cardTitle, isBanned && { color: colors.error }]}>{item.name}</ThemedText>
                </View>
                <ThemedText style={styles.cardDesc}>{item.email}</ThemedText>
                <ThemedText style={styles.cardDesc}>Role: {item.role}</ThemedText>
                <ThemedText style={[styles.cardDesc, isBanned ? { color: colors.error } : { color: colors.success }]}>
                  Status: {isBanned ? `Banned until ${new Date(item.lockUntil!).toLocaleDateString()}` : 'Active'}
                </ThemedText>
                <View style={styles.cardActions}>
                  {isBanned ? (
                    <Button title="Unban" size="small" variant="secondary" onPress={() => handleUnbanUser(item._id)} />
                  ) : (
                    <Button title="Ban" size="small" variant="outline" onPress={() => handleBanUser(item._id)} />
                  )}
                  <Button title="Remove" size="small" variant="outline" onPress={() => handleDeleteUser(item._id)} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </>
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ThemedText type="title" style={styles.title}>Admin Dashboard</ThemedText>

        <View style={[styles.tabContainer, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'categories' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('categories')}
          >
            <ThemedText style={{ color: activeTab === 'categories' ? '#fff' : colors.text, fontWeight: 'bold' }}>Categories</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'users' && { backgroundColor: colors.tint }]}
            onPress={() => setActiveTab('users')}
          >
            <ThemedText style={{ color: activeTab === 'users' ? '#fff' : colors.text, fontWeight: 'bold' }}>Users</ThemedText>
          </TouchableOpacity>
        </View>

        {activeTab === 'categories' ? renderCategories() : renderUsers()}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
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
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  formContainer: {
    marginBottom: Spacing.four,
    padding: Spacing.three,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  listItem: {
    marginBottom: Spacing.three,
    padding: Spacing.three,
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
    opacity: 0.8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
});
