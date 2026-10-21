import { Text, View } from "react-native";

import { Icon } from "@/components/icons/Icon";
import { CenteredModal } from "@/components/ui/CenteredModal";
import { DetailField } from "@/components/ui/DetailField";
import { Tag } from "@/components/ui/Tag";
import {
  credentialCategoryIcon,
  credentialCategoryLabel,
  credentialSecretLabel,
  credentialUsernameLabel,
} from "@/components/vault/credentialCategory";
import { DitherEmblem } from "@/components/vault/DitherEmblem";
import type { Credential } from "@/types/vault";

type CredentialDetailModalProps = {
  credential: Credential;
  secret: string;
  onClose: () => void;
};

// Shown only after Face ID. The header block mirrors the card: the dithered emblem on top, then black with the accent color and display title.
export function CredentialDetailModal({ credential, secret, onClose }: CredentialDetailModalProps) {
  return (
    <CenteredModal onClose={onClose}>
      <View
        className="rounded-block bg-linear-to-tl from-focus to-focus/80"
        style={{ overflow: "hidden" }}
      >
        <View className="gap-8 p-6">
          <View className="flex-row items-center justify-between">
            <Text
              className="font-medium text-xs uppercase text-focus-text"
              style={{ opacity: 0.6 }}
            >
              {credentialCategoryLabel[credential.category]}
            </Text>
          </View>

          {/* pt-2 + line height >= 1.2x font size: keeps the top of the glyphs inside the line box. */}
          <View className="pt-2">
            <Text
              className="font-display text-focus-text"
              style={{ fontSize: 40, lineHeight: 48, letterSpacing: -1.5 }}
              numberOfLines={2}
            >
              {credential.title}
            </Text>
          </View>
        </View>
      </View>

      {credential.category !== "identity" && (
        <>
          <View className="flex-row flex-wrap gap-2">
            <Tag label={credential.username} />
          </View>

          <DetailField
            label={credentialUsernameLabel[credential.category]}
            value={credential.username}
            copyable
          />
        </>
      )}

      <DetailField label={credentialSecretLabel[credential.category]} value={secret} copyable />
    </CenteredModal>
  );
}
