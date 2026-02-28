import React from "react";
import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import { colors, fonts } from "../../constants/theme";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.icon} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  message: {
    fontSize: 14,
    fontFamily: fonts.sans.regular,
    color: colors.textMuted,
    marginTop: 12,
  },
});
