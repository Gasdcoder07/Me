import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";

import { Icon } from "@/components/icons/Icon";
import { colors } from "@/constants/theme";

const COPIED_FEEDBACK_MS = 1500;

type DetailFieldProps = {
  label: string;
  value: string;
  // Adds a copy button beside the value.
  copyable?: boolean;
};

// Black block for one value, the same focus treatment as the vault summary.
// Selectable, so a long press copies the value. With `copyable`, the button copies it in one tap.
export function DetailField({ label, value, copyable = false }: DetailFieldProps) {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(value);
    } catch {
      Alert.alert("No se pudo copiar", "Inténtalo de nuevo.");
      return;
    }

    setIsCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <View className="gap-2 rounded-block border border-ink-faint shadow-xs  p-5">
      <Text className="font-medium text-xs uppercase text-focus" style={{ opacity: 0.6 }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Text className="flex-1 font-title text-xl text-focus/70" selectable>
          {value}
        </Text>
        {copyable && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copiar ${label}`}
            hitSlop={12}
            onPress={copy}
          >
            <Icon name={isCopied ? "check" : "copy"} size={20} color={colors.inkMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
