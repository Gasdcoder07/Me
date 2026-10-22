import { memo } from "react";
import { Text, View } from "react-native";

import { Icon } from "@/components/icons/Icon";
import { LavaBackground } from "@/components/ui/LavaBackground";
import { radii } from "@/constants/theme";
import { useTheme } from "@/theme/ThemeProvider";

type VaultSummaryBlockProps = {
  count: number;
  isPaused?: boolean;
};

// Focus block: the theme's base, large display number, the accent as the single highlight.
// The base carries slow glows, tinted by the color theme, that drift like lava behind the content.
// Behind the card, a flash in the highlight color: a blurred shadow that shows only past the card's edge.
function VaultSummaryBlockBase({ count, isPaused = false }: VaultSummaryBlockProps) {
  const { colors } = useTheme();
  return (
    <View>
      <View
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          borderRadius: radii.block,
          backgroundColor: colors.highlight,
          shadowColor: colors.highlight,
          shadowOpacity: 0.1,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
        }}
      />

      <View className="bg-focus p-6" style={{ borderRadius: radii.block, overflow: "hidden" }}>
        <LavaBackground paused={isPaused} />

        <View className="flex-row items-center justify-between">
          <Icon name="key" size={28} color={colors.focusText} />
          <Text className="font-medium text-xs uppercase text-focus-text">
            Cifrado en este dispositivo
          </Text>
        </View>

        {/* pt-2 + line height >= 1.2x font size: avoids clipping the top of the numeral. */}
        <View className="mt-8 pt-2">
          <Text
            className="font-display text-focus-text"
            style={{ fontSize: 112, lineHeight: 134, letterSpacing: -5 }}
          >
            {count}
          </Text>
        </View>
        <Text className="mt-2 font-regular text-base text-focus-text">credenciales guardadas</Text>
      </View>
    </View>
  );
}

// Memoized: the vault screen re-renders on every filter change and form toggle, and the glow is costly.
export const VaultSummaryBlock = memo(VaultSummaryBlockBase);
