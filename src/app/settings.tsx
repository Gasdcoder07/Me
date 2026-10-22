import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CircleButton } from '@/components/ui/CircleButton';
import { Screen } from '@/components/ui/Screen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { spring } from '@/constants/motion';
import { radii } from '@/constants/theme';
import { type Appearance, buildPalette, COLOR_THEME_IDS, type ColorThemeId, type Palette } from '@/constants/themes';
import { usePressScale } from '@/hooks/usePressScale';
import { useTheme } from '@/theme/ThemeProvider';

// Name and one-line mood for each color theme, in the order they are offered.
const colorThemeInfo: Record<ColorThemeId, { name: string; mood: string }> = {
  niebla: { name: 'Niebla', mood: 'Original, acento negro grafito' },
  esmeralda: { name: 'Esmeralda', mood: 'Acento verde azulado' },
  anil: { name: 'Añil', mood: 'Acento azul añil' },
  rosa: { name: 'Rosa', mood: 'Acento rosa pastel' },
  ruby: { name: 'Ruby', mood: 'Acento rojo ruby' },
  morado: { name: 'Morado', mood: 'Acento morado' },
};

const appearanceOptions: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

// Choices apply right away and are saved. The layout never changes between them.
export default function SettingsScreen() {
  const router = useRouter();
  const { colorTheme, appearance, setColorTheme, setAppearance } = useTheme();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 140, gap: 32 }}
      >
        <View className="flex-row items-end justify-between">
          <View className="pt-2">
            <Text className="font-display text-ink" style={{ fontSize: 56, lineHeight: 68, letterSpacing: -2 }}>
              Ajustes
            </Text>
          </View>
          <CircleButton icon="close" label="Cerrar" variant="ghost" size={56} onPress={() => router.back()} />
        </View>

        <View className="gap-4">
          <SectionTitle>Modo</SectionTitle>
          <SegmentedToggle options={appearanceOptions} value={appearance} onChange={setAppearance} />
        </View>

        <View className="gap-4">
          <SectionTitle>Tema</SectionTitle>
          <View className="gap-3">
            {COLOR_THEME_IDS.map((id) => (
              <ThemeOption
                key={id}
                name={colorThemeInfo[id].name}
                mood={colorThemeInfo[id].mood}
                // Each card previews its theme in the appearance that is active now.
                palette={buildPalette(id, appearance)}
                isSelected={id === colorTheme}
                onSelect={() => setColorTheme(id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

type ThemeOptionProps = {
  name: string;
  mood: string;
  palette: Palette;
  isSelected: boolean;
  onSelect: () => void;
};

// A preview card: the theme's canvas with three swatches. The selected card gets a ring that springs in.
function ThemeOption({ name, mood, palette, isSelected, onSelect }: ThemeOptionProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const selection = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selection.value = withSpring(isSelected ? 1 : 0, spring);
  }, [isSelected, selection]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: selection.value,
    transform: [{ scale: 0.96 + 0.04 * selection.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Tema ${name}`}
        accessibilityState={{ selected: isSelected }}
        onPress={onSelect}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View
          className="flex-row items-center justify-between p-5"
          style={{ borderRadius: radii.card, backgroundColor: palette.canvas }}
        >
          <View className="gap-1">
            <Text className="font-title text-lg" style={{ color: palette.ink }}>
              {name}
            </Text>
            <Text className="font-regular text-sm" style={{ color: palette.inkMuted }}>
              {mood}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Swatch color={palette.canvas} border={palette.inkFaint} />
            <Swatch color={palette.accent} />
            <Swatch color={palette.highlight} />
          </View>
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            {
              ...absoluteFill,
              borderRadius: radii.card,
              borderWidth: 2,
              borderColor: colors.ink,
            },
            ringStyle,
          ]}
        />
      </Pressable>
    </Animated.View>
  );
}

type SwatchProps = {
  color: string;
  border?: string;
};

function Swatch({ color, border }: SwatchProps) {
  return (
    <View
      className="h-6 w-6 rounded-full"
      style={{ backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border }}
    />
  );
}

const absoluteFill = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;
