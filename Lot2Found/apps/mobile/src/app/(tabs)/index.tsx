import * as Device from 'expo-device';
import { Platform, StyleSheet, Button, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

const API_URL = 'http://localhost:5000/api'; // Update to real local IP when testing on device

export default function HomeScreen() {
  const { user, signOut, token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Welcome, {user?.name || 'User'}
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.stepContainer}>
          <ThemedText style={{ textAlign: 'center', marginBottom: Spacing.two }}>
            Email: {user?.email}
          </ThemedText>
          <ThemedText style={{ textAlign: 'center', marginBottom: Spacing.four, fontWeight: 'bold' }}>
            Role: {user?.role.replace('_', ' ').toUpperCase()}
          </ThemedText>
          
          <Button title="Logout" onPress={signOut} color="#ff3b30" />
        </ThemedView>

        {user?.role === 'admin' && (
          <ThemedView style={styles.adminPanel}>
            <ThemedText type="subtitle" style={{ marginBottom: Spacing.two }}>
              Admin Panel - Manage Users
            </ThemedText>
            {loadingUsers ? (
              <ActivityIndicator />
            ) : (
              <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View>
                      <ThemedText>{item.name}</ThemedText>
                      <ThemedText type="small">{item.role}</ThemedText>
                    </View>
                    {item._id !== user._id && (
                      <Button title="Delete" onPress={() => deleteUser(item._id)} color="red" />
                    )}
                  </View>
                )}
                style={{ width: '100%', maxHeight: 300 }}
              />
            )}
          </ThemedView>
        )}

      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  adminPanel: {
    alignSelf: 'stretch',
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
});
