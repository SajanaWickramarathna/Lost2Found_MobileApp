import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export default function PostTypeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Post an Item</ThemedText>
      <ThemedText style={styles.subtitle}>Did you lose something or find something?</ThemedText>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, { backgroundColor: '#FF6B6B' }]}
          onPress={() => router.push('/post/lost')}
        >
          <ThemedText style={styles.buttonText}>I Lost Something</ThemedText>
        </Pressable>

        <Pressable 
          style={[styles.button, { backgroundColor: '#4ECDC4' }]}
          onPress={() => router.push('/post/found')}
        >
          <ThemedText style={styles.buttonText}>I Found Something</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.six,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.four,
  },
  button: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
