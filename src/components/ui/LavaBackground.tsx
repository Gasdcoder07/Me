import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// Drifting radial glows, in a 400 x 300 coordinate space scaled to fill the parent.
type LavaBlob = {
  id: string;
  color: string;
  peakOpacity: number;
  from: { cx: number; cy: number; r: number };
  to: { cx: number; cy: number; r: number };
  duration: number;
  delay: number;
};

const lavaBlobs: LavaBlob[] = [
  {
    id: 'lava-a',
    color: '#2c2c2c',
    peakOpacity: 0.9,
    from: { cx: 90, cy: 80, r: 150 },
    to: { cx: 230, cy: 170, r: 190 },
    duration: 7000,
    delay: 0,
  },
  {
    id: 'lava-b',
    color: '#3a3a3a',
    peakOpacity: 0.8,
    from: { cx: 320, cy: 60, r: 120 },
    to: { cx: 250, cy: 200, r: 160 },
    duration: 9000,
    delay: 800,
  },
  {
    id: 'lava-c',
    color: '#1d1d1d',
    peakOpacity: 1,
    from: { cx: 180, cy: 260, r: 170 },
    to: { cx: 60, cy: 150, r: 130 },
    duration: 8000,
    delay: 1500,
  },
  {
    // Smallest, brightest blob: the occasional dark-grey flash.
    id: 'lava-d',
    color: '#4a4a4a',
    peakOpacity: 0.45,
    from: { cx: 330, cy: 250, r: 90 },
    to: { cx: 240, cy: 120, r: 110 },
    duration: 6000,
    delay: 300,
  },
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type LavaBackgroundProps = {
  // Freezes the drift while an overlay covers the surface, so it does not compete with the overlay's animation.
  paused?: boolean;
};

// Glow layer that fills its parent. The parent is the black surface and must clip (overflow: hidden).
// The SVG waits for its measured size so the glow covers the whole surface, edge to edge.
// Tabs keep their screens mounted, so the drift also stops while this screen is not focused.
export function LavaBackground({ paused = false }: LavaBackgroundProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const isFocused = useIsFocused();
  const isRunning = isFocused && !paused;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
      {size && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={size.width}
          height={size.height}
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            {lavaBlobs.map((blob) => (
              <RadialGradient key={blob.id} id={blob.id} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={blob.color} stopOpacity={blob.peakOpacity} />
                <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          {lavaBlobs.map((blob) => (
            <LavaGlow key={blob.id} blob={blob} isRunning={isRunning} />
          ))}
        </Svg>
      )}
    </View>
  );
}

type LavaGlowProps = {
  blob: LavaBlob;
  isRunning: boolean;
};

// Each glow moves between its two positions forever, reversing with a sine ease so the motion never snaps.
// When not running, the animation is cancelled and the glow holds where it is.
function LavaGlow({ blob, isRunning }: LavaGlowProps) {
  const cx = useSharedValue(blob.from.cx);
  const cy = useSharedValue(blob.from.cy);
  const r = useSharedValue(blob.from.r);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation(cx);
      cancelAnimation(cy);
      cancelAnimation(r);
      return;
    }

    const motion = { duration: blob.duration, easing: Easing.inOut(Easing.sin) };
    const loop = (target: number) => withDelay(blob.delay, withRepeat(withTiming(target, motion), -1, true));

    cx.value = loop(blob.to.cx);
    cy.value = loop(blob.to.cy);
    r.value = loop(blob.to.r);
  }, [blob, isRunning, cx, cy, r]);

  const animatedProps = useAnimatedProps(() => ({
    cx: cx.value,
    cy: cy.value,
    r: r.value,
  }));

  return (
    <AnimatedCircle
      cx={blob.from.cx}
      cy={blob.from.cy}
      r={blob.from.r}
      fill={`url(#${blob.id})`}
      animatedProps={animatedProps}
    />
  );
}
