import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { Icon } from "@/components/icons/Icon";
import {
  credentialCategoryIcon,
  credentialCategoryLabel,
} from "@/components/vault/credentialCategory";
import { DitherEmblem } from "@/components/vault/DitherEmblem";
import { radii } from "@/constants/theme";
import { glassOnFocus } from "@/constants/themes";
import { usePressScale } from "@/hooks/usePressScale";
import { useTheme } from "@/theme/ThemeProvider";
import type { Credential } from "@/types/vault";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CredentialCardProps = {
  credential: Credential;
  accessibilityLabel: string;
  // Receives the credential back, so the list can pass one stable handler to every card.
  onPress: (credential: Credential) => void;
};

// Landscape card on a dithered field. The title sits on the left, the category's dithered shape on the right.
// The category label is at the top and the username chip under the title. Identity has no chip.
function CredentialCardBase({ credential, accessibilityLabel, onPress }: CredentialCardProps) {
  const { colors } = useTheme();
  const chipStyle = glassOnFocus(colors);
  const { animatedStyle, onPressIn, onPressOut } = usePressScale();
  const chips = credential.category === "identity" ? [] : [credential.username];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onPress(credential)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ borderRadius: radii.block, backgroundColor: colors.focus, overflow: "hidden" }, animatedStyle]}
    >
      {/*<DitherEmblem category={credential.category}>*/}
      <View className="flex-1 justify-end p-5 h-36 bg-linear-to-r from-focus to-focus/90">
        <View className="gap-3" style={{ maxWidth: "52%" }}>
          {/* Line height >= 1.2x font size keeps the top of the glyphs inside the line box. */}
          <Text
            className="font-display text-focus-text"
            style={{ fontSize: 32, lineHeight: 40, letterSpacing: -1 }}
            numberOfLines={2}
          >
            {credential.title}
          </Text>

          {chips.map((chip) => (
            <View key={chip} className="self-start rounded-full px-3 py-1.5" style={chipStyle}>
              <Text className="font-medium text-xs text-focus-text" numberOfLines={1}>
                {chip}
              </Text>
            </View>
          ))}
        </View>
      </View>
      {/*</DitherEmblem>*/}
    </AnimatedPressable>
  );
}

export const CredentialCard = memo(CredentialCardBase);
