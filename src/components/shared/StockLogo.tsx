import React, { useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { SvgUri } from "react-native-svg";

const AVATAR_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
];

interface StockLogoProps {
  logoUrl?: string | null;
  symbol: string;
  size?: number;
}

/**
 * Displays a stock logo with fallback to letter avatar.
 * Handles SVG and raster images, with graceful error fallback.
 */
export default function StockLogo({
  logoUrl,
  symbol,
  size = 44,
}: StockLogoProps) {
  const [hasError, setHasError] = useState(false);

  const color = AVATAR_COLORS[symbol.charCodeAt(0) % AVATAR_COLORS.length];

  // Show letter avatar if no URL or if image failed to load
  if (!logoUrl || hasError) {
    return (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>
          {symbol.slice(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  // Check if it's an SVG image
  const isSvg = logoUrl.toLowerCase().endsWith(".svg");

  if (isSvg) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <SvgUri
          width={size}
          height={size}
          uri={logoUrl}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
      resizeMode="contain"
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
  },
});
