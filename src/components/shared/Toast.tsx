import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { colors } from "../../constants/theme";

export interface ToastConfig {
  type: "success" | "error";
  msg: unknown;
  duration?: number; // ms, defaults to 3000
}

interface ToastProps {
  config: ToastConfig | null;
  onClose?: () => void;
}

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER_OFFSET = 20;
const DISMISS_DISTANCE = 40;
const DISMISS_VELOCITY = 800; // px/s — a flick is enough, distance alone isn't required

export default function Toast({ config, onClose }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(ENTER_OFFSET);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    onClose?.();
  };

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    opacity.set(withTiming(0, { duration: 200, easing: EASE_OUT }));
    translateY.set(
      withTiming(
        ENTER_OFFSET,
        { duration: 200, easing: EASE_OUT },
        (finished) => {
          if (finished) scheduleOnRN(handleClose);
        },
      ),
    );
  };

  useEffect(() => {
    if (!config) {
      opacity.set(0);
      translateY.set(ENTER_OFFSET);
      return;
    }

    // Reset and animate in
    translateY.set(ENTER_OFFSET);
    opacity.set(withTiming(1, { duration: 280, easing: EASE_OUT }));
    translateY.set(withTiming(0, { duration: 280, easing: EASE_OUT }));

    const duration = config.duration ?? 3000;
    dismissTimer.current = setTimeout(dismiss, duration);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.set(e.translationY);
    })
    .onEnd((e) => {
      const dragged = Math.abs(e.translationY) > DISMISS_DISTANCE;
      const flicked = Math.abs(e.velocityY) > DISMISS_VELOCITY;
      if (dragged || flicked) {
        // Continue off-screen in the direction the user threw it — same path in and out
        const direction = e.translationY < 0 ? -1 : 1;
        opacity.set(withTiming(0, { duration: 180, easing: EASE_OUT }));
        translateY.set(
          withTiming(
            direction * 120,
            { duration: 180, easing: EASE_OUT },
            (finished) => {
              if (finished) scheduleOnRN(handleClose);
            },
          ),
        );
      } else {
        translateY.set(
          withSpring(0, { duration: 300, dampingRatio: 0.8, velocity: e.velocityY }),
        );
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  if (!config) return null;

  // Normalize message to a safe string for display
  const rawMsg = config.msg;
  let displayMsg = "";
  if (typeof rawMsg === "string") displayMsg = rawMsg;
  else if (rawMsg && typeof (rawMsg as any).message === "string")
    displayMsg = (rawMsg as any).message;
  else {
    try {
      displayMsg = JSON.stringify(rawMsg);
    } catch {
      displayMsg = String(rawMsg ?? "");
    }
  }

  // Sanitize common noisy runtime messages
  if (
    !displayMsg ||
    displayMsg === "undefined" ||
    displayMsg.includes("undefined is not a function")
  ) {
    displayMsg = "An unexpected error occurred";
  }

  const isSuccess = config.type === "success";
  const borderColor = isSuccess
    ? "rgba(0, 255, 136, 0.35)"
    : "rgba(255, 107, 107, 0.35)";

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.container, animatedStyle, { borderColor }]}>
        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={1}
          style={styles.inner}
        >
          <Text style={styles.text}>{displayMsg}</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
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
