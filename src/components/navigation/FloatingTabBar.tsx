import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/icons/Icon';
import { PROGRESSIVE_BLUR_HEIGHT, ProgressiveBlur } from '@/components/navigation/ProgressiveBlur';
import { duration, easing, spring, timing } from '@/constants/motion';
import { liftShadow } from '@/constants/theme';
import { withAlpha } from '@/constants/themes';
import { useTheme } from '@/theme/ThemeProvider';

// expo-router does not export the tab bar props type publicly; derive it from Tabs.
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const tabIcons: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'vault', label: 'Bóveda' },
  files: { icon: 'files', label: 'Archivos' },
  time: { icon: 'clock', label: 'Tiempo' },
};

const BAR_HEIGHT = 76;
const BAR_INSET = 16;
const ICON_SIZE = 24;
const LABEL_WIDTH = 72;
const LABEL_GAP = 8;
// Icon, gap and label as one fixed box, centred in its slot so the label never reflows while animating.
const CONTENT_WIDTH = ICON_SIZE + LABEL_GAP + LABEL_WIDTH;
// The icon is centred in the box when collapsed and slides to the box's left edge when active.
const ICON_CENTRED_X = (CONTENT_WIDTH - ICON_SIZE) / 2;
const LABEL_X = ICON_SIZE + LABEL_GAP;

// The indicator glides between slots on the same curve as the segmented toggle, so the two controls feel alike.
const INDICATOR_MOTION = timing(duration.medium, easing.inOut);

const CLAMP = Extrapolation.CLAMP;

// Floating glass capsule, detached from the screen edges. One black indicator slides under the active tab,
// its width taken from the measured bar so it adapts to any screen. The progressive blur sits behind it.
export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Entrance: the bar rises and fades in each time the tabs mount (on launch and after unlock).
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withTiming(1, timing(duration.entrance, easing.out));
  }, [entrance]);

  // Fractional slot position shared by the indicator and every tab, so all of them move in sync.
  const position = useSharedValue(state.index);
  const [rowWidth, setRowWidth] = useState(0);
  const slotWidth = rowWidth / state.routes.length;

  useEffect(() => {
    position.value = withTiming(state.index, INDICATOR_MOTION);
  }, [state.index, position]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [120, 0], CLAMP) }],
  }));

  const indicatorStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: position.value * slotWidth }] }),
    [slotWidth],
  );

  const onRowLayout = (event: LayoutChangeEvent) => {
    setRowWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: PROGRESSIVE_BLUR_HEIGHT }}
    >
      <ProgressiveBlur />

      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', left: BAR_INSET, right: BAR_INSET, bottom: insets.bottom + 12 }, barStyle]}
      >
        {/* Outer layer carries the shadow; the inner layer clips the glass to the capsule. */}
        <View style={[{ height: BAR_HEIGHT, borderRadius: BAR_HEIGHT / 2 }, liftShadow]}>
          <View
            style={{
              flex: 1,
              borderRadius: BAR_HEIGHT / 2,
              overflow: 'hidden',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: withAlpha(colors.focusText, 0.7),
            }}
          >
            <BlurView tint={colors.appearance} intensity={30} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.canvas, 0.5) }]} />
            {/* Soft sheen along the top edge, the glass highlight. */}
            <LinearGradient
              colors={[withAlpha(colors.focusText, 0.12), withAlpha(colors.focusText, 0)]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.7 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={{ flex: 1, flexDirection: 'row' }} onLayout={onRowLayout}>
              {/* Drawn first so the tabs sit above it. Full bar height, one slot wide, rounded like the capsule. */}
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: slotWidth,
                    borderRadius: BAR_HEIGHT / 2,
                    backgroundColor: colors.accent,
                  },
                  indicatorStyle,
                ]}
              />

              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const tab = tabIcons[route.name];

                return (
                  <TabItem
                    key={route.key}
                    icon={tab.icon}
                    label={tab.label}
                    index={index}
                    position={position}
                    isFocused={isFocused}
                    onPress={() => {
                      if (!isFocused) navigation.navigate(route.name);
                    }}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

type TabItemProps = {
  icon: IconName;
  label: string;
  index: number;
  position: SharedValue<number>;
  isFocused: boolean;
  onPress: () => void;
};

// One slot of the bar. The slot is the touch target and spans the full height of the bar. How "active" the tab is
// comes from the shared position: 1 when the indicator is on it, 0 when it is far away, blending in between.
function TabItem({ icon, label, index, position, isFocused, onPress }: TabItemProps) {
  const { colors } = useTheme();
  const press = useSharedValue(1);
  const [isPressed, setIsPressed] = useState(false);

  const focus = useDerivedValue(() => 1 - Math.min(1, Math.abs(position.value - index)));

  // Press feedback: a slight shrink while the finger is down, springing back on release.
  useEffect(() => {
    press.value = isPressed ? withTiming(0.94, timing(duration.fast)) : withSpring(1, spring);
  }, [isPressed, press]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  const iconMoveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(focus.value, [0, 1], [0, -ICON_CENTRED_X], CLAMP) }],
  }));

  const mutedIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [1, 0], CLAMP),
  }));

  const lightIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [0, 1], CLAMP),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 1], [0, 1], CLAMP),
    transform: [{ translateX: interpolate(focus.value, [0, 1], [-6, 0], CLAMP) }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: CONTENT_WIDTH, height: '100%' }, boxStyle]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: ICON_CENTRED_X + 10,
              top: '50%',
              marginTop: -ICON_SIZE / 2,
              width: ICON_SIZE,
              height: ICON_SIZE,
            },
            iconMoveStyle,
          ]}
        >
          {/* Two icons stacked and crossfaded: muted when inactive, light when active. */}
          <Animated.View style={[StyleSheet.absoluteFill, mutedIconStyle]}>
            <Icon name={icon} size={ICON_SIZE} color={colors.inkMuted} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, lightIconStyle]}>
            <Icon name={icon} size={ICON_SIZE} color={colors.onAccent} />
          </Animated.View>
        </Animated.View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: LABEL_X + 10,
              top: 0,
              bottom: 0,
              width: LABEL_WIDTH,
              justifyContent: 'center',
            },
            labelStyle,
          ]}
        >
          <Animated.Text
            numberOfLines={1}
            style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: colors.onAccent }}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
