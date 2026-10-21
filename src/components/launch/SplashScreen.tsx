import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LavaCanvas } from '@/components/ui/LavaBackground';
import { useTheme } from '@/theme/ThemeProvider';

const CIRCLE_SIZE = 200;
const TURN_DURATION_MS = 7000;

type SplashScreenProps = {
  // The title uses the Outfit font, so it stays hidden until the fonts have loaded.
  showTitle?: boolean;
};

// Shown while the app starts: the black lava circle turns slowly until loading finishes.
// Fills its parent so it can stand in for the whole screen, both while fonts load and while the database opens.
export function SplashScreen({ showTitle = true }: SplashScreenProps) {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: TURN_DURATION_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <Animated.View
        style={[
          {
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            overflow: 'hidden',
            backgroundColor: colors.focus,
          },
          spinStyle,
        ]}
      >
        <LavaCanvas width={CIRCLE_SIZE} height={CIRCLE_SIZE} isRunning />
      </Animated.View>

      {showTitle && (
        <Text className="font-display text-ink" style={{ fontSize: 56, lineHeight: 64, letterSpacing: -2 }}>
          Mi
        </Text>
      )}
    </View>
  );
}
