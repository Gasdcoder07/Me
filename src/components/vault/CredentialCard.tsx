import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icons/Icon";
import {
  credentialCategoryIcon,
  credentialCategoryLabel,
} from "@/components/vault/credentialCategory";
import { DitherEmblem } from "@/components/vault/DitherEmblem";
import { colors, radii } from "@/constants/theme";
import type { Credential } from "@/types/vault";

type CredentialCardProps = {
  credential: Credential;
  accessibilityLabel: string;
  // Receives the credential back, so the list can pass one stable handler to every card.
  onPress: (credential: Credential) => void;
};

// Landscape card on a dithered field. The title sits on the left, the category's dithered shape on the right.
// The category label is at the top and the username chip under the title. Identity has no chip.
function CredentialCardBase({ credential, accessibilityLabel, onPress }: CredentialCardProps) {
  const chips = credential.category === "identity" ? [] : [credential.username];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => onPress(credential)}
      style={({ pressed }) => [
        { borderRadius: radii.block, backgroundColor: colors.focus, overflow: "hidden" },
        pressed && { opacity: 0.85 },
      ]}
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
    </Pressable>
  );
}

export const CredentialCard = memo(CredentialCardBase);

// Translucent chip over the dithered field, the same glass as the next-reminder card.
const chipStyle = {
  backgroundColor: "rgba(239, 235, 226, 0.1)",
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: "rgba(239, 235, 226, 0.25)",
};
