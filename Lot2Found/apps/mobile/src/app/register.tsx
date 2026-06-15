import { useState } from 'react';
import { StyleSheet, TextInput, View, Button, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Picker } from '@react-native-picker/picker'; // You might need to install this or build a custom select

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ad_viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await signUp({ name, email, password, role });
      setSuccessMsg(response.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>Check Your Email</ThemedText>
        <ThemedText style={{ textAlign: 'center', marginBottom: 20 }}>{successMsg}</ThemedText>
        <Button title="Go to Login" onPress={() => router.replace('/login')} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Sign Up</ThemedText>
      
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Basic Role Selection Simulation for Expo */}
      <View style={styles.roleContainer}>
        <ThemedText>Select Role:</ThemedText>
        <View style={styles.roleButtons}>
          <Button 
            title="Viewer" 
            onPress={() => setRole('ad_viewer')} 
            color={role === 'ad_viewer' ? '#0a7ea4' : '#888'} 
          />
          <Button 
            title="Poster" 
            onPress={() => setRole('ad_poster')} 
            color={role === 'ad_poster' ? '#0a7ea4' : '#888'} 
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Register" onPress={handleRegister} />
        )}
      </View>

      <View style={styles.footer}>
        <ThemedText>Already have an account? </ThemedText>
        <Link href="/login" asChild>
          <ThemedText style={styles.link}>Sign In</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    color: '#000',
    backgroundColor: '#fff',
  },
  roleContainer: {
    marginBottom: Spacing.four,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.two,
  },
  buttonContainer: {
    marginBottom: Spacing.four,
  },
  errorText: {
    color: 'red',
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  link: {
    color: '#0a7ea4',
    fontWeight: 'bold',
  },
});
