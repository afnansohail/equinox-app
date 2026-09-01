import React from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps extends PressableProps {
  /** Scale applied on press-in. Keep subtle — 0.95 to 0.98. */
  scaleTo?: number;
}

/**
 * Pressable with press-in/press-out scale feedback, run on the UI thread
 * via Reanimated so it stays smooth regardless of what the JS thread is doing.
 */
export function ScalePressable({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      style={[animatedStyle, style as any]}
      onPressIn={(e) => {
        scale.set(withTiming(scaleTo, { duration: 120 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withTiming(1, { duration: 120 }));
        onPressOut?.(e);
      }}
      {...props}
    />
  );
}
