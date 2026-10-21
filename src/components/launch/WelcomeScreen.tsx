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
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { LavaCanvas } from "@/components/ui/LavaBackground";
import { LineField } from "@/components/ui/LineField";
import { Screen } from "@/components/ui/Screen";
import { withAlpha } from "@/constants/themes";
import { useTheme } from "@/theme/ThemeProvider";
import { useFieldScroll, useKeyboardHeight } from "@/hooks/useKeyboard";

const NAME_MAX_LENGTH = 40;
const HERO_HEIGHT = 280;

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
  const { scrollRef, scrollToEnd } = useFieldScroll();
  const { width } = useWindowDimensions();

  const name = savedName ?? draft.trim();
  const canContinue = name.length > 0;

  const submit = () => {
    if (canContinue) onContinue(name);
  };

  // The keyboard lifts the whole body (greeting, field and button) by its height, so the button always sits
  // above the keyboard and the field never ends up underneath it.
  const bodyStyle = useAnimatedStyle(
    () => ({ paddingBottom: Math.max(insets.bottom, keyboard.value) }),
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
          overflow: "hidden",
          backgroundColor: colors.focus,
        }}
      >
        <StatusBar barStyle={"light-content"} />
        <LavaCanvas width={width} height={HERO_HEIGHT + insets.top} isRunning />
        <BlurView tint="dark" intensity={55} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={veilColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.View style={[{ flex: 1 }, bodyStyle]}>
        {/* Scrolls only on short screens, when greeting and field do not fit above the keyboard. */}
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            gap: 40,
            paddingHorizontal: 24,
          }}
        >
          <View>
            <Text
              className="font-display text-ink"
              style={{ fontSize: 56, lineHeight: 64, letterSpacing: -2 }}
            >
              Hola,
            </Text>
            <Text
              className="font-display text-ink"
              style={{ fontSize: 56, lineHeight: 64, letterSpacing: -2 }}
            >
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
              onFocus={scrollToEnd}
              maxLength={NAME_MAX_LENGTH}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
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
