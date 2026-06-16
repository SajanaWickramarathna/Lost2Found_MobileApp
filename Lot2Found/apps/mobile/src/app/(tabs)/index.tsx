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
import { Colors, Spacing, Shadows } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/context/auth';
import { Card } from '@/components/ui/Card';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
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
    const badgeColor = isLost ? colors.error : colors.success;
    
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
      <Card style={styles.cardContainer}>
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
      </Card>
    );
  };

  const FilterTab = ({ title, value }: { title: string, value: FilterType }) => {
    const isActive = filterType === value;
    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        style={[
          styles.filterTab, 
          { backgroundColor: isActive ? colors.tint : colors.backgroundElement, borderColor: isActive ? colors.tint : colors.border }
        ]} 
        onPress={() => setFilterType(value)}
      >
        <ThemedText style={[styles.filterTabText, { color: isActive ? '#fff' : colors.text }]}>
          {title}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title" style={styles.mainTitle}>Lost & Found</ThemedText>
          <ThemedText style={styles.subTitle}>Discover or report items</ThemedText>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>Sign Out</ThemedText>
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
              <ThemedText style={{ color: colors.textDim }}>No items found.</ThemedText>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  signOutBtn: {
    padding: Spacing.one,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  cardContainer: {
    padding: 0,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
  },
  cardContent: {
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardTitle: {
    flex: 1,
    marginRight: Spacing.two,
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardDescription: {
    marginBottom: Spacing.three,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.two,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
});
