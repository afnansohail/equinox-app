import React, { useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import { colors } from "../../constants/theme";

export interface ToastConfig {
  type: "success" | "error";
  msg: string;
  duration?: number; // ms, defaults to 3000
}

interface ToastProps {
  config: ToastConfig | null;
  onClose?: () => void;
}

export default function Toast({ config, onClose }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose?.());
  };

  useEffect(() => {
    if (!config) {
      opacity.setValue(0);
      translateY.setValue(20);
      return;
    }

    // Reset and animate in
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    const duration = config.duration ?? 3000;
    dismissTimer.current = setTimeout(dismiss, duration);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dy) > 40 || Math.abs(gs.vy) > 0.8) {
          dismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!config) return null;

  const isSuccess = config.type === "success";
  const borderColor = isSuccess
    ? "rgba(0, 255, 136, 0.35)"
    : "rgba(255, 107, 107, 0.35)";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          borderColor,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onPress={dismiss} activeOpacity={1} style={styles.inner}>
        <Text style={styles.text}>{config.msg}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
