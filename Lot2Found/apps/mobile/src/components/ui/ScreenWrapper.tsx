import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { Colors } from '@/constants/theme';

interface ScreenWrapperProps extends ViewProps {
  scrollable?: boolean;
  withSafeArea?: boolean;
  keyboardOffset?: number;
}

export function ScreenWrapper({
  children,
  style,
  scrollable = false,
  withSafeArea = true,
  keyboardOffset = 0,
  ...props
}: ScreenWrapperProps) {
  const themeColors = useTheme();
  const backgroundColor = themeColors.background;
  const insets = useSafeAreaInsets();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );

  const Container = withSafeArea ? SafeAreaView : View;
  const containerStyle = withSafeArea
    ? [styles.container, { backgroundColor }]
    : [styles.container, { backgroundColor, paddingTop: insets.top }];

  return (
    <Container style={containerStyle}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardOffset : 0}
      >
        {content}
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
