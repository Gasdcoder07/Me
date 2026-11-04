import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

// Drifting radial glows, in a 400 x 300 coordinate space scaled to fill the parent.
// `tone` indexes the active palette's `lava` colors, so each theme tints the glow.
type LavaBlob = {
  id: string;
  tone: 0 | 1 | 2 | 3;
  peakOpacity: number;
  from: { cx: number; cy: number; r: number };
  to: { cx: number; cy: number; r: number };
  duration: number;
  delay: number;
};

// The design space the blob coordinates are written in. The canvas covers its parent the way
// preserveAspectRatio="xMidYMid slice" would: scaled to cover, centred, overflow clipped.
const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 300;

const lavaBlobs: LavaBlob[] = [
  {
    id: 'lava-a',
    tone: 0,
    peakOpacity: 0.9,
    from: { cx: 90, cy: 80, r: 150 },
    to: { cx: 230, cy: 170, r: 190 },
    duration: 7000,
    delay: 0,
  },
  {
    id: 'lava-b',
    tone: 1,
    peakOpacity: 0.8,
    from: { cx: 320, cy: 60, r: 120 },
    to: { cx: 250, cy: 200, r: 160 },
    duration: 9000,
    delay: 800,
  },
  {
    id: 'lava-c',
    tone: 2,
    peakOpacity: 1,
    from: { cx: 180, cy: 260, r: 170 },
    to: { cx: 60, cy: 150, r: 130 },
    duration: 8000,
    delay: 1500,
  },
  {
    // Smallest, brightest blob: the occasional flash.
    id: 'lava-d',
    tone: 3,
    peakOpacity: 0.45,
    from: { cx: 330, cy: 250, r: 90 },
    to: { cx: 240, cy: 120, r: 110 },
    duration: 6000,
    delay: 300,
  },
];

type LavaBackgroundProps = {
  // Freezes the drift while an overlay covers the surface, so it does not compete with the overlay's animation.
  paused?: boolean;
};

type LavaCanvasProps = {
  width: number;
  height: number;
  isRunning: boolean;
};

// The glow drawn at a known size. Use it directly when there is no navigation focus to read (the splash),
// otherwise go through LavaBackground.
//
// Each blob is its own static SVG inside an Animated.View, and only the view's transform animates.
// Animating the circle's cx/cy/r instead would make react-native-svg redraw the whole vector canvas on
// the main thread on every frame; a transform is composited, so the raster is drawn once and reused.
export function LavaCanvas({ width, height, isRunning }: LavaCanvasProps) {
  const { colors } = useTheme();

  // Cover the parent and centre the overflow, the way preserveAspectRatio="xMidYMid slice" does.
  const scale = Math.max(width / VIEW_WIDTH, height / VIEW_HEIGHT);
  const offsetX = (width - VIEW_WIDTH * scale) / 2;
  const offsetY = (height - VIEW_HEIGHT * scale) / 2;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {lavaBlobs.map((blob) => (
        <LavaGlow
          key={blob.id}
          blob={blob}
          color={colors.lava[blob.tone]}
          isRunning={isRunning}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
        />
      ))}
    </View>
  );
}

// Glow layer that fills its parent. The parent is the black surface and must clip (overflow: hidden).
// The canvas waits for its measured size so the glow covers the whole surface, edge to edge.
// Tabs keep their screens mounted, so the drift also stops while this screen is not focused.
export function LavaBackground({ paused = false }: LavaBackgroundProps) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const isFocused = useIsFocused();
  const isRunning = isFocused && !paused;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((current) =>
      current && current.width === width && current.height === height ? current : { width, height },
    );
  };

  return (
    <View pointerEvents="none" onLayout={onLayout} style={StyleSheet.absoluteFill}>
      {size && <LavaCanvas width={size.width} height={size.height} isRunning={isRunning} />}
    </View>
  );
}

type LavaGlowProps = {
  blob: LavaBlob;
  color: string;
  isRunning: boolean;
  scale: number;
  offsetX: number;
  offsetY: number;
};

// One glow. It is drawn once at its largest radius, then a single progress value moves it between its two
// positions forever, reversing with a sine ease so the motion never snaps. Position and radius share the
// progress, so they stay in phase exactly as three separate animations of the same duration did.
// When not running, the animation is cancelled and the glow holds where it is.
function LavaGlow({ blob, color, isRunning, scale, offsetX, offsetY }: LavaGlowProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimation(progress);
      return;
    }

    const motion = { duration: blob.duration, easing: Easing.inOut(Easing.sin) };
    progress.value = withDelay(blob.delay, withRepeat(withTiming(1, motion), -1, true));

    // Unmounting (the lock screen, a screen change) must stop the infinite loop too, not just pause it.
    return () => cancelAnimation(progress);
  }, [blob, isRunning, progress]);

  // Drawn at the larger of the two radii, so the animated scale only ever shrinks the raster and the glow
  // never looks soft from being blown up.
  const peakRadius = Math.max(blob.from.r, blob.to.r);
  const size = peakRadius * 2 * scale;
  // Placed so the circle's centre sits on `from`, which is where progress 0 leaves it.
  const left = offsetX + (blob.from.cx - peakRadius) * scale;
  const top = offsetY + (blob.from.cy - peakRadius) * scale;
  const shiftX = (blob.to.cx - blob.from.cx) * scale;
  const shiftY = (blob.to.cy - blob.from.cy) * scale;
  const fromScale = blob.from.r / peakRadius;
  const toScale = blob.to.r / peakRadius;

  const glowStyle = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: progress.value * shiftX },
        { translateY: progress.value * shiftY },
        { scale: fromScale + progress.value * (toScale - fromScale) },
      ],
    }),
    [shiftX, shiftY, fromScale, toScale],
  );

  return (
    <Animated.View style={[{ position: 'absolute', left, top, width: size, height: size }, glowStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id={blob.id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={blob.peakOpacity} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${blob.id})`} />
      </Svg>
    </Animated.View>
  );
}
