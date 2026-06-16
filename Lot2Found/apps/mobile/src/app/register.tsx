import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await signUp({ name, email, password });
      setSuccessMsg(response.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <ScreenWrapper scrollable>
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Check Your Email</ThemedText>
            <ThemedText style={styles.subtitle}>{successMsg}</ThemedText>
          </View>
          <Button title="Go to Login" onPress={() => router.replace('/login')} size="large" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
          <ThemedText style={styles.subtitle}>Sign up to get started</ThemedText>
        </View>
        
        {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

        <View style={styles.form}>
          <Input
            label="Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={loading}
              size="large"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText>Already have an account? </ThemedText>
          <Link href="/login" asChild>
            <ThemedText style={styles.link}>Sign In</ThemedText>
          </Link>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: Spacing.four,
  },
  buttonContainer: {
    marginTop: Spacing.three,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: Spacing.three,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  link: {
    color: '#4F46E5', // Primary tint color
    fontWeight: 'bold',
  },
});
