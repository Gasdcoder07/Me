import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CircleButton } from '@/components/ui/CircleButton';
import { colors, liftShadow, radii } from '@/constants/theme';

type CenteredModalProps = {
  onClose: () => void;
  children: ReactNode;
};

const ANIMATION = { duration: 240, easing: Easing.out(Easing.cubic) };

// Floating panel centred on the screen. It mounts open and fades/scales in. Closing runs the reverse
// animation first and only then calls onClose, so the parent unmounts it and any secret it held.
export function CenteredModal({ onClose, children }: CenteredModalProps) {
  const { height: windowHeight } = useWindowDimensions();
  // 0 = closed, 1 = fully open.
  const progress = useSharedValue(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isClosing) {
      progress.value = withTiming(0, ANIMATION, (finished) => {
        if (finished) scheduleOnRN(onClose);
      });
    } else {
      progress.value = withTiming(1, ANIMATION);
    }
  }, [isClosing, onClose, progress]);

  const close = () => setIsClosing(true);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 10, 0.45)' }, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Cerrar" onPress={close} />
        </Animated.View>

        <Animated.View style={[{ width: '100%', borderRadius: radii.screen, ...liftShadow }, panelStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              maxHeight: windowHeight * 0.85,
              borderRadius: radii.screen,
              backgroundColor: colors.canvas,
              overflow: 'hidden',
            }}
            contentContainerStyle={{ padding: 24, gap: 20, alignItems: 'stretch' }}
          >
            {children}

            <View className="items-center pt-2">
              <CircleButton icon="close" label="Cerrar" variant="solid" size={56} onPress={close} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
