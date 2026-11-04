import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { interpolate, useAnimatedStyle, useDerivedValue } from "react-native-reanimated";

import { LavaCanvas } from "@/components/ui/LavaBackground";
import { LineField } from "@/components/ui/LineField";
import { Screen } from "@/components/ui/Screen";
import { withAlpha } from "@/constants/themes";
import { useTheme } from "@/theme/ThemeProvider";
import { useKeyboardHeight } from "@/hooks/useKeyboard";

const NAME_MAX_LENGTH = 40;
// The hero band and the greeting shrink while the keyboard is open, so greeting, field and button all keep
// their place above the keyboard instead of the greeting being pushed off the top.
const HERO_HEIGHT = 280;
const HERO_HEIGHT_COMPACT = 112;
const TITLE_SIZE = 56;
const TITLE_SIZE_COMPACT = 32;
const TITLE_LINE_RATIO = 64 / TITLE_SIZE;
const GAP = 40;
const GAP_COMPACT = 24;
// Keyboard height at which the screen is fully compact. Every iOS keyboard is taller than this, so the
// band reaches its compact size as the keyboard finishes rising.
const KEYBOARD_FULL = 260;

type WelcomeScreenProps = {
  // Null on the first launch: the screen asks for the name. Otherwise the stored name is shown.
  savedName: string | null;
  onContinue: (name: string) => void;
};

// Greeting after the splash. The owner's name is the only thing stored; there is no session behind it.
export function WelcomeScreen({ savedName, onContinue }: WelcomeScreenProps) {
  const { colors } = useTheme();
  // The canvas veil starts at 70% over the top of the band (dark at about 30%) and eases to full canvas at the bottom.
  const veilColors = [withAlpha(colors.canvas, 0), colors.canvas] as const;
  const [draft, setDraft] = useState("");
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const { width } = useWindowDimensions();

  const name = savedName ?? draft.trim();
  const canContinue = name.length > 0;

  const submit = () => {
    if (canContinue) onContinue(name);
  };

  // 0 with the keyboard down, 1 with it fully up. Everything that has to give room reads this one value,
  // so the whole screen moves on the keyboard's own curve.
  const compact = useDerivedValue(() => Math.min(keyboard.value / KEYBOARD_FULL, 1), [keyboard]);

  // The band gives up most of its height to the body. The lava canvas keeps its full size and is clipped.
  const heroStyle = useAnimatedStyle(
    () => ({ height: interpolate(compact.value, [0, 1], [HERO_HEIGHT, HERO_HEIGHT_COMPACT]) + insets.top }),
    [insets.top],
  );

  // The keyboard lifts the whole body (greeting, field and button) by its height, so the button always sits
  // above the keyboard and the field never ends up underneath it.
  const bodyStyle = useAnimatedStyle(
    () => ({ paddingBottom: Math.max(insets.bottom, keyboard.value) }),
    [insets.bottom, keyboard],
  );

  // The greeting stays on screen; it only gets smaller, so the eye follows it down instead of losing it.
  const titleStyle = useAnimatedStyle(() => {
    const size = interpolate(compact.value, [0, 1], [TITLE_SIZE, TITLE_SIZE_COMPACT]);
    return { fontSize: size, lineHeight: size * TITLE_LINE_RATIO };
  });

  const fieldStyle = useAnimatedStyle(() => ({
    marginTop: interpolate(compact.value, [0, 1], [GAP, GAP_COMPACT]),
  }));

  const titleType = {
    fontFamily: "Outfit_700Bold",
    letterSpacing: -2,
    color: colors.ink,
  } as const;

  return (
    <Screen mesh={false}>
      {/* Soft lava band across the top: the glow is blurred, then a canvas veil lightens it from the top down
          so it reaches the canvas without a hard edge. The band starts at the very top edge: the negative
          margin cancels the safe-area inset the screen adds. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            marginTop: -insets.top,
            overflow: "hidden",
            backgroundColor: colors.focus,
          },
          heroStyle,
        ]}
      >
        <StatusBar barStyle={"light-content"} />
        <LavaCanvas width={width} height={HERO_HEIGHT + insets.top} isRunning />
        {/* Flat veil in the band's own color instead of a live blur. A blur here would re-sample the whole
            band every frame, because the glow underneath never stops moving; the glow is already soft, so
            the blur only darkened it. */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(colors.focus, 0.45) }]} />
        <LinearGradient
          colors={veilColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, bodyStyle]}>
        {/* Scrolls only on short screens, when greeting and field do not fit above the keyboard. */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View>
            <Animated.Text style={[titleType, titleStyle]}>Hola,</Animated.Text>
            <Animated.Text style={[titleType, titleStyle]}>bienvenido a Mi.</Animated.Text>
          </View>

          <Animated.View style={fieldStyle}>
            {savedName ? (
              <Text className="font-title text-2xl text-ink">{savedName}</Text>
            ) : (
              <LineField
                label="Tu nombre"
                placeholder="Escribe tu nombre"
                value={draft}
                onChangeText={setDraft}
                maxLength={NAME_MAX_LENGTH}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            )}
          </Animated.View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
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
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.focus,
              },
              !canContinue && { opacity: 0.3 },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text className="font-medium text-base text-focus-text">Continuar</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Screen>
  );
}
