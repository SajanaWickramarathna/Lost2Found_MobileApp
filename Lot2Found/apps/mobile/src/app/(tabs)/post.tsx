import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Card } from '@/components/ui/Card';

export default function PostTypeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Post an Item</ThemedText>
          <ThemedText style={styles.subtitle}>Did you lose something or find something?</ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/post/lost')}>
            <Card style={[styles.card, { borderColor: '#EF4444', borderWidth: 2 }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
                <ThemedText style={{ fontSize: 32 }}>🔍</ThemedText>
              </View>
              <View style={styles.cardTextContainer}>
                <ThemedText type="subtitle" style={{ color: '#EF4444', marginBottom: 4 }}>I Lost Something</ThemedText>
                <ThemedText style={{ opacity: 0.7 }}>Report an item you've lost so others can help find it.</ThemedText>
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/post/found')}>
            <Card style={[styles.card, { borderColor: '#10B981', borderWidth: 2 }]}>
              <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                <ThemedText style={{ fontSize: 32 }}>✨</ThemedText>
              </View>
              <View style={styles.cardTextContainer}>
                <ThemedText type="subtitle" style={{ color: '#10B981', marginBottom: 4 }}>I Found Something</ThemedText>
                <ThemedText style={{ opacity: 0.7 }}>Report an item you've found to help return it to its owner.</ThemedText>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.six,
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.two,
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.four,
  },
  cardTextContainer: {
    flex: 1,
  },
});
