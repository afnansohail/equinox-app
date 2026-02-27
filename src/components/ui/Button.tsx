import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type TouchableOpacityProps,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'rounded-xl py-3 px-6 items-center justify-center';
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-primary active:opacity-80',
    secondary: 'bg-card border border-border active:opacity-80',
    ghost: 'bg-transparent active:opacity-60',
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          className={`font-semibold ${
            variant === 'primary' ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

