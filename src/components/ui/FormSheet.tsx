import { type ReactNode, type RefObject, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { radii } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboard';

type FormSheetProps = {
  visible: boolean;
  onClose: () => void;
  // From useFieldScroll, so the focused field can scroll into view.
  scrollRef: RefObject<ScrollView | null>;
  children: ReactNode;
  // Pinned under the scrolling fields, with no extra space below it.
  footer: ReactNode;
};

const SHEET_ANIMATION = { duration: 280, easing: Easing.out(Easing.cubic) };
// Space between the top of the sheet and the top of the screen.
const SHEET_TOP_GAP = 16;
// Space between the footer and the keyboard when it is open.
const KEYBOARD_GAP = 12;

// Bottom sheet sized to its content, up to almost the top of the screen. Only the fields scroll when they do not fit;
// the footer stays pinned right under them, with no empty space between the last field and the button.
// The Modal does not animate itself: the backdrop fades and the sheet slides separately, so the dim layer stays put.
export function FormSheet({ visible, onClose, scrollRef, children, footer }: FormSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxSheetHeight = windowHeight - insets.top - SHEET_TOP_GAP;
  const keyboard = useKeyboardHeight();
  // Keeps the Modal mounted while the closing animation runs.
  const [isRendered, setIsRendered] = useState(visible);
  // 0 = hidden, 1 = fully open.
  const progress = useSharedValue(0);

  // Mount the Modal in the same render that opens it, so the slide-in has a frame to start from.
  if (visible && !isRendered) setIsRendered(true);

  useEffect(() => {
    if (visible) {
      progress.value = withTiming(1, SHEET_ANIMATION);
    } else {
      progress.value = withTiming(0, SHEET_ANIMATION, (finished) => {
        if (finished) scheduleOnRN(setIsRendered, false);
      });
    }
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  // The sheet keeps its place. The keyboard only adds bottom padding, which lifts the footer above it.
  const sheetStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: (1 - progress.value) * windowHeight }],
      paddingBottom: Math.max(insets.bottom, keyboard.value + KEYBOARD_GAP),
    }),
    [windowHeight, insets.bottom, keyboard],
  );

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.35)' }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="bg-canvas"
          style={[
            {
              maxHeight: maxSheetHeight,
              borderTopLeftRadius: radii.screen,
              borderTopRightRadius: radii.screen,
            },
            sheetStyle,
          ]}
        >
          <View className="flex-row items-center justify-between px-6 pt-6">
            <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose}>
              <Text className="font-medium text-base text-ink-muted">Cancelar</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, gap: 28 }}
          >
            {children}
          </ScrollView>

          <View className="px-6 pt-4">{footer}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}
