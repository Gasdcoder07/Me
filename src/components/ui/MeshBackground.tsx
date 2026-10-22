import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { type Appearance } from '@/constants/themes';
import { useTheme } from '@/theme/ThemeProvider';

// How strong the colour washes are on each appearance. Light stays faint so the UI never loses contrast.
// Set light to 0 to switch the mesh off in light mode.
const MESH_STRENGTH: Record<Appearance, number> = { dark: 0.3, light: 0.08 };

// Four soft washes spread over the screen, so their overlaps read as a mesh. Positions are percentages of the surface.
const washes = [
  { id: 'mesh-a', cx: '20%', cy: '15%', r: '60%' },
  { id: 'mesh-b', cx: '85%', cy: '45%', r: '55%' },
  { id: 'mesh-c', cx: '25%', cy: '80%', r: '60%' },
  { id: 'mesh-d', cx: '80%', cy: '95%', r: '50%' },
] as const;

// Static colour mesh behind a page, drawn from the active theme. It takes no animation and no measured size:
// the SVG fills its parent and the gradients are relative to it.
export function MeshBackground() {
  const { colors } = useTheme();
  const strength = MESH_STRENGTH[colors.appearance];

  if (strength === 0) return null;

  // Colours come from the theme tokens: each wash picks one accent of the active colour theme.
  const tones = [colors.highlight, colors.lava[0], colors.accent, colors.lava[2]];

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        {washes.map((wash, index) => (
          <RadialGradient key={wash.id} id={wash.id} cx={wash.cx} cy={wash.cy} r={wash.r}>
            <Stop offset="0" stopColor={tones[index]} stopOpacity={strength} />
            <Stop offset="1" stopColor={tones[index]} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {washes.map((wash) => (
        <Rect key={wash.id} x="0" y="0" width="100%" height="100%" fill={`url(#${wash.id})`} />
      ))}
    </Svg>
  );
}
