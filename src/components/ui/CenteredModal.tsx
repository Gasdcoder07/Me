import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CircleButton } from '@/components/ui/CircleButton';
import { duration, easing, timing } from '@/constants/motion';
import { liftShadow, radii } from '@/constants/theme';
import { SCRIM, withAlpha } from '@/constants/themes';
import { useTheme } from '@/theme/ThemeProvider';

type CenteredModalProps = {
  onClose: () => void;
  // The parent sets this to close the modal itself, with the same animation as the close button.
  dismissed?: boolean;
  // Extra circle buttons beside the close button, at the bottom of the panel.
  actions?: ReactNode;
  children: ReactNode;
};

const ANIMATION = timing(duration.base, easing.out);

// Floating panel centred on the screen. It mounts open and fades/scales in. Closing runs the reverse
// animation first and only then calls onClose, so the parent unmounts it and any secret it held.
export function CenteredModal({ onClose, dismissed = false, actions, children }: CenteredModalProps) {
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  // 0 = closed, 1 = fully open.
  const progress = useSharedValue(0);
  const [isClosedByUser, setIsClosedByUser] = useState(false);
  const isClosing = isClosedByUser || dismissed;
  // Parents pass an inline onClose, which changes on every render. Reading it from a ref keeps a re-render
  // during the close animation from restarting that animation.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isClosing) {
      const finish = () => onCloseRef.current();
      progress.value = withTiming(0, ANIMATION, (finished) => {
        if (finished) scheduleOnRN(finish);
      });
    } else {
      progress.value = withTiming(1, ANIMATION);
    }
  }, [isClosing, progress]);

  const close = () => setIsClosedByUser(true);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  return (
    <Modal transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(SCRIM, 0.45) }, backdropStyle]}
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

            <View className="flex-row items-center justify-center gap-4 pt-2">
              {actions}
              <CircleButton icon="close" label="Cerrar" variant="solid" size={56} onPress={close} />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
