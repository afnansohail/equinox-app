import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  value: number;
  showSign?: boolean;
}

export function Badge({ value, showSign = true }: BadgeProps) {
  const isPositive = value >= 0;
  const bgColor = isPositive ? 'bg-success/20' : 'bg-danger/20';
  const textColor = isPositive ? 'text-success' : 'text-danger';
  const sign = showSign ? (isPositive ? '+' : '') : '';

  return (
    <View className={`${bgColor} rounded-lg px-2 py-1`}>
      <Text className={`${textColor} text-xs font-semibold`}>
        {sign}
        {value.toFixed(2)}%
      </Text>
    </View>
  );
}

