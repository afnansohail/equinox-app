import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  ViewStyle,
  ScrollViewProps,
} from "react-native";

interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  extraScrollHeight?: number;
}

/**
 * A keyboard-aware ScrollView wrapper that handles both iOS and Android.
 * Scrolls the focused input into view when the keyboard appears.
 */
export default function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  extraScrollHeight = 80,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
