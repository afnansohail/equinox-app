import React, { useState } from "react";
import { Image, View, Text, StyleSheet } from "react-native";
import { SvgUri } from "react-native-svg";
import { colors, fonts } from "../../constants/theme";

interface StockLogoProps {
  logoUrl?: string | null;
  symbol: string;
  size?: number;
}

/**
 * Displays a stock logo with fallback to letter avatar.
 * Handles SVG and raster images, with graceful error fallback.
 * Rounded-square tile (not circular) to match the redesign's avatar language.
 */
export default function StockLogo({
  logoUrl,
  symbol,
  size = 44,
}: StockLogoProps) {
  const [hasError, setHasError] = useState(false);
  const radius = Math.round(size * 0.34);

  // Show letter avatar if no URL or if image failed to load
  if (!logoUrl || hasError) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.28 }]}>
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
          borderRadius: radius,
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
        borderRadius: radius,
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
    backgroundColor: colors.accentTile,
  },
  avatarText: {
    color: colors.secondary,
    fontFamily: fonts.sans.extrabold,
  },
});
