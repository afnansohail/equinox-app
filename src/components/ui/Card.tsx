import React from 'react';
import { View, type ViewProps } from 'react-native';
import { colors, theme } from '../../constants/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[theme.card, style]} {...props}>
      {children}
    </View>
  );
}
