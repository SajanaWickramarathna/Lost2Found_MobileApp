import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Button, ActivityIndicator } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const { signIn, signInWithOAuth } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Configure Google SDK
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
  }, []);

  const promptGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo: any = await GoogleSignin.signIn();
      // Depending on the SDK version, idToken is either at the root or under .data
      const idToken = userInfo.idToken || userInfo.data?.idToken;
      if (idToken) {
        await handleOAuthLogin('google', { idToken });
      }
    } catch (e: any) {
      setError(e.message || 'Google Login canceled or failed');
    } finally {
      setLoading(false);
    }
  };

  const promptFacebook = async () => {
    try {
      setLoading(true);
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (!result.isCancelled) {
        const data = await AccessToken.getCurrentAccessToken();
        if (data?.accessToken) {
          await handleOAuthLogin('facebook', { accessToken: data.accessToken.toString() });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Facebook Login canceled or failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook', payload: any) => {
    setLoading(true);
    setError('');
    try {
      await signInWithOAuth(provider, payload);
      router.replace('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await signIn({ email, password });
      router.replace('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Sign In</ThemedText>
      
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

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

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Login" onPress={handleLogin} />
        )}
      </View>

      <View style={styles.socialContainer}>
        <ThemedText style={{ textAlign: 'center', marginBottom: 10 }}>Or sign in with</ThemedText>
        <View style={styles.socialButtons}>
          <Button title="Google" onPress={() => promptGoogle()} disabled={loading} color="#DB4437" />
          <View style={{ width: 10 }} />
          <Button title="Facebook" onPress={() => promptFacebook()} disabled={loading} color="#4267B2" />
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText>Don't have an account? </ThemedText>
        <Link href="/register" asChild>
          <ThemedText style={styles.link}>Sign Up</ThemedText>
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
  buttonContainer: {
    marginTop: Spacing.two,
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
  socialContainer: {
    marginBottom: Spacing.four,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
