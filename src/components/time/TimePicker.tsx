import { useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/theme';

export type TimeValue = { hours: number; minutes: number };

const ITEM_HEIGHT = 44;
// Only the picked value and one neighbour on each side are shown. The edges fade out to make the rest visible.
const VISIBLE_ITEMS = 3;
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

// The form sits on the canvas, so the fade ends in the canvas colour (transparent at the very edge).
const fadeOutColors = [colors.canvas, 'rgba(233, 238, 243, 0)'] as const;
const fadeInColors = ['rgba(233, 238, 243, 0)', colors.canvas] as const;

type TimePickerProps = {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
};

// Two vertical wheels, hour and minute. Each one snaps to a value when the scroll stops, like the iOS picker.
export function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <View className="flex-row items-center justify-center gap-4" style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}>
      <Wheel
        label="Hora"
        values={HOURS}
        selected={value.hours}
        onSelect={(hours) => onChange({ ...value, hours })}
      />
      <Text className="font-title text-2xl text-ink">:</Text>
      <Wheel
        label="Minuto"
        values={MINUTES}
        selected={value.minutes}
        onSelect={(minutes) => onChange({ ...value, minutes })}
      />
    </View>
  );
}

type WheelProps = {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
};

function Wheel({ label, values, selected, onSelect }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);

  // Values are 0, 1, 2, … so the index of a value is the value itself.
  const settle = (offsetY: number) => {
    const index = Math.min(values.length - 1, Math.max(0, Math.round(offsetY / ITEM_HEIGHT)));
    if (values[index] !== selected) onSelect(values[index]);
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    settle(event.nativeEvent.contentOffset.y);
  };

  const scrollTo = (value: number) => {
    scrollRef.current?.scrollTo({ y: value * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ width: 96, height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden' }} accessibilityLabel={label}>
      <ScrollView
        ref={scrollRef}
        // Opens on the current value. Padding above and below lets the first and last values reach the middle.
        contentOffset={{ x: 0, y: selected * ITEM_HEIGHT }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {values.map((value) => {
          const isSelected = value === selected;

          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                scrollTo(value);
                onSelect(value);
              }}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                className="font-title text-2xl"
                style={{ color: isSelected ? colors.ink : colors.inkMuted }}
              >
                {String(value).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Hairlines around the middle item mark the value that is picked. They ignore touches. */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2), height: ITEM_HEIGHT, justifyContent: 'center' },
        ]}
      >
        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.inkFaint, height: ITEM_HEIGHT }} />
      </View>

      {/* Fades over the top and bottom items; the picked item in the middle is never covered. */}
      <LinearGradient
        pointerEvents="none"
        colors={fadeOutColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.fade, { top: 0 }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={fadeInColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.fade, { bottom: 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
  },
});
