import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

// Height of the whole effect, measured up from the bottom edge of the screen.
export const PROGRESSIVE_BLUR_HEIGHT = 200;

// Mask alpha: fully transparent at the top (no blur), opaque at the bottom edge (full blur).
// The eased stops give a smooth ramp instead of a linear one.
const maskStops = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.25)',
  'rgba(0, 0, 0, 0.8)',
  'rgba(0, 0, 0, 1)',
] as const;
const maskLocations = [0, 0.35, 0.7, 1] as const;

const fadeColors = ['rgba(239, 235, 226, 0)', 'rgba(239, 235, 226, 0.5)'] as const;

// Progressive blur behind the floating tab bar. A gradient mask makes the blur fade smoothly
// from the bottom edge upward, so no hard edge shows at the top of the effect.
export function ProgressiveBlur() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={maskStops}
            locations={maskLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView tint="light" intensity={45} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={fadeColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MaskedView>
    </View>
  );
}
