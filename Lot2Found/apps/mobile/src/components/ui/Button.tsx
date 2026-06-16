import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Colors, Shadows, Spacing } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}: ButtonProps) {
  const themeColors = useTheme();

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Spacing.two,
      opacity: disabled || loading ? 0.6 : 1,
    };

    const sizeStyles = {
      small: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, height: 36 },
      medium: { paddingVertical: 12, paddingHorizontal: Spacing.four, height: 48 },
      large: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, height: 56 },
    };

    const variantStyles = {
      primary: {
        backgroundColor: themeColors.tint,
        ...Shadows.sm,
      },
      secondary: {
        backgroundColor: themeColors.backgroundSelected,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: themeColors.border,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return { ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] } as ViewStyle;
  };

  const getTextStyles = (): TextStyle => {
    const variantTextColors = {
      primary: '#FFFFFF', // always white for primary
      secondary: themeColors.text,
      outline: themeColors.text,
      ghost: themeColors.tint,
    };

    const sizeTextStyles = {
      small: { fontSize: 14, fontWeight: '500' as const },
      medium: { fontSize: 16, fontWeight: '600' as const },
      large: { fontSize: 18, fontWeight: '700' as const },
    };

    return {
      color: variantTextColors[variant],
      ...sizeTextStyles[size],
      marginLeft: icon && !loading ? Spacing.two : 0,
    };
  };

  return (
    <TouchableOpacity
      style={[getContainerStyles(), style]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : themeColors.tint} />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
