import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Shadows, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ elevated = true, style, children, ...props }: CardProps) {
  const themeColors = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.border,
        },
        elevated ? Shadows.sm : { borderWidth: 1 },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginBottom: Spacing.three,
  },
});
