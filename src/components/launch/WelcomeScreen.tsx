import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { LavaCanvas } from '@/components/ui/LavaBackground';
import { LineField } from '@/components/ui/LineField';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboard';

const NAME_MAX_LENGTH = 40;
const HERO_HEIGHT = 280;
// The canvas veil starts at 70% over the top of the band (dark at about 30%) and eases to full canvas at the bottom.
const veilColors = ['rgba(233, 238, 243, 0.7)', colors.canvas] as const;

type WelcomeScreenProps = {
  // Null on the first launch: the screen asks for the name. Otherwise the stored name is shown.
  savedName: string | null;
  onContinue: (name: string) => void;
};

// Greeting after the splash. The owner's name is the only thing stored; there is no session behind it.
export function WelcomeScreen({ savedName, onContinue }: WelcomeScreenProps) {
  const [draft, setDraft] = useState('');
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { width } = useWindowDimensions();

  const name = savedName ?? draft.trim();
  const canContinue = name.length > 0;

  const submit = () => {
    if (canContinue) onContinue(name);
  };

  // The keyboard pushes the button up, the greeting stays where it is.
  const footerStyle = useAnimatedStyle(
    () => ({ paddingBottom: Math.max(insets.bottom, keyboard.value) + 24 }),
    [insets.bottom, keyboard],
  );

  return (
    <Screen>
      {/* Soft lava band across the top: the glow is blurred, then a canvas veil lightens it from the top down
          so it reaches the canvas without a hard edge. The band starts at the very top edge: the negative
          margin cancels the safe-area inset the screen adds. */}
      <View
        pointerEvents="none"
        style={{
          height: HERO_HEIGHT + insets.top,
          marginTop: -insets.top,
          overflow: 'hidden',
          backgroundColor: colors.focus,
        }}
      >
        <LavaCanvas width={width} height={HERO_HEIGHT + insets.top} isRunning />
        <BlurView tint="dark" intensity={55} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={veilColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View className="flex-1 justify-center gap-10 px-6">
        <View>
          <Text className="font-display text-ink" style={{ fontSize: 56, lineHeight: 64, letterSpacing: -2 }}>
            Hola,
          </Text>
          <Text className="font-display text-ink" style={{ fontSize: 56, lineHeight: 64, letterSpacing: -2 }}>
            bienvenido a Mi.
          </Text>
        </View>

        {savedName ? (
          <Text className="font-title text-2xl text-ink">{savedName}</Text>
        ) : (
          <LineField
            label="Tu nombre"
            placeholder="Escribe tu nombre"
            value={draft}
            onChangeText={setDraft}
            maxLength={NAME_MAX_LENGTH}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        )}
      </View>

      <Animated.View style={[{ paddingHorizontal: 24 }, footerStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar"
          accessibilityState={{ disabled: !canContinue }}
          disabled={!canContinue}
          onPress={submit}
          style={({ pressed }) => [
            {
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.focus,
            },
            !canContinue && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text className="font-medium text-base text-focus-text">Continuar</Text>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}
