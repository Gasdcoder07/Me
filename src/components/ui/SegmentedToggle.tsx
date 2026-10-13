import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/constants/theme';

type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedToggleProps<T extends string> = {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const MOTION = { duration: 320, easing: Easing.inOut(Easing.ease) };

// Elongated container. The active option is a solid block that slides between slots;
// labels cross-fade from muted to light as the block passes under them.
export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const slotWidth = trackWidth / options.length;

  // Fractional slot position, shared between the block and the labels so both move in sync.
  const position = useSharedValue(activeIndex);

  useEffect(() => {
    position.value = withTiming(activeIndex, MOTION);
  }, [activeIndex, position]);

  const blockStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: position.value * slotWidth }] }),
    [slotWidth],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className="flex-row rounded-full border border-ink-faint p-1">
      <View className="flex-1 flex-row" onLayout={onTrackLayout}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: slotWidth,
              borderRadius: 999,
              backgroundColor: colors.focus,
            },
            blockStyle,
          ]}
        />

        {options.map((option, index) => {
          const isActive = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => onChange(option.value)}
              className="flex-1 items-center py-3"
            >
              <ToggleLabel label={option.label} index={index} position={position} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ToggleLabelProps = {
  label: string;
  index: number;
  position: SharedValue<number>;
};

// Typography mirrors `font-medium text-sm`; color is driven by the shared position.
function ToggleLabel({ label, index, position }: ToggleLabelProps) {
  const textStyle = useAnimatedStyle(() => {
    const proximity = 1 - Math.min(1, Math.abs(position.value - index));

    return {
      color: interpolateColor(proximity, [0, 1], [colors.inkMuted, colors.focusText]),
    };
  });

  return (
    <Animated.Text
      style={[{ fontFamily: 'Outfit_500Medium', fontSize: 14, lineHeight: 20, textAlign: 'center' }, textStyle]}
    >
      {label}
    </Animated.Text>
  );
}
