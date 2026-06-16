import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/context/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
// The backend serves images from the root URL /uploads/...
const BASE_URL = API_URL.replace('/api', '');

type FilterType = 'all' | 'lost' | 'found';

interface Item {
  _id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  status: string;
  images: string[];
  locationName: string;
  category?: { name: string; icon: string };
  user?: { name: string };
  createdAt: string;
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { signOut } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');

  const fetchItems = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    try {
      let url = `${API_URL}/items`;
      if (filterType !== 'all') {
        url += `?type=${filterType}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Error fetching items:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(true);
  }, [filterType]);

  const renderItem = ({ item }: { item: Item }) => {
    const isLost = item.type === 'lost';
    const badgeColor = isLost ? '#ff4d4d' : '#4CAF50';
    
    const getImageUrl = (path: string) => {
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
      }
      return `${BASE_URL}${path}`;
    };

    const imageUrl = item.images && item.images.length > 0 
      ? { uri: getImageUrl(item.images[0]) } 
      : require('@/assets/images/react-logo.png'); // fallback image

    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <Image source={imageUrl} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.cardTitle}>
              {item.title}
            </ThemedText>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <ThemedText style={styles.badgeText}>{isLost ? 'LOST' : 'FOUND'}</ThemedText>
            </View>
          </View>
          
          <ThemedText numberOfLines={2} style={styles.cardDescription}>
            {item.description}
          </ThemedText>
          
          <View style={styles.cardFooter}>
            <ThemedText type="small" style={{ color: colors.textDim }}>
              📍 {item.locationName || 'Unknown Location'}
            </ThemedText>
            {item.user && (
              <ThemedText type="small" style={{ color: colors.textDim }}>
                👤 {item.user.name}
              </ThemedText>
            )}
          </View>
        </View>
      </ThemedView>
    );
  };

  const FilterTab = ({ title, value }: { title: string, value: FilterType }) => {
    const isActive = filterType === value;
    return (
      <TouchableOpacity 
        style={[
          styles.filterTab, 
          isActive && { backgroundColor: colors.tint, borderColor: colors.tint }
        ]} 
        onPress={() => setFilterType(value)}
      >
        <ThemedText style={[styles.filterTabText, isActive && { color: '#fff' }]}>
          {title}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="title">Lost & Found</ThemedText>
        <TouchableOpacity onPress={signOut}>
          <ThemedText style={{ color: colors.tint }}>Sign Out</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <FilterTab title="All Items" value="all" />
        <FilterTab title="Lost" value="lost" />
        <FilterTab title="Found" value="found" />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <ThemedText>No items found.</ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterTabText: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDescription: {
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
