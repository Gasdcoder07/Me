import { useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, type KeyboardEvent, type LayoutChangeEvent } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

const FALLBACK_DURATION_MS = 250;
const FIELD_MARGIN = 16;

// Keyboard height in points, animated along the system keyboard curve. Sheets read it as bottom padding,
// so the keyboard pushes the footer up and the sheet itself never moves. iOS only: Android resizes the window.
export function useKeyboardHeight(): SharedValue<number> {
  const height = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const animateTo = (target: number, duration?: number) => {
      height.value = withTiming(target, {
        duration: duration || FALLBACK_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
    };

    const show = Keyboard.addListener('keyboardWillShow', (event: KeyboardEvent) => {
      animateTo(event.endCoordinates.height, event.duration);
    });
    const hide = Keyboard.addListener('keyboardWillHide', (event: KeyboardEvent) => {
      animateTo(0, event.duration);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [height]);

  return height;
}

// Keeps the focused field visible inside a ScrollView that shrinks while the keyboard is open.
// Register each field's wrapper with `fieldProps(key)`: onFocus scrolls its top to the top of the viewport.
export function useFieldScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const layouts = useRef<Record<string, { y: number }>>({});

  const fieldProps = (key: string) => ({
    onLayout: (event: LayoutChangeEvent) => {
      layouts.current[key] = { y: event.nativeEvent.layout.y };
    },
    onFocus: () => {
      const layout = layouts.current[key];
      if (layout) scrollRef.current?.scrollTo({ y: Math.max(0, layout.y - FIELD_MARGIN), animated: true });
    },
  });

  // For fields nested inside a row (no reliable offset): the form's end is where they sit.
  const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

  return { scrollRef, fieldProps, scrollToEnd };
}
