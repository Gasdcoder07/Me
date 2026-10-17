import type { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";

import banksEmblem from "../../../assets/emblems/banks.png";
import accessEmblem from "../../../assets/emblems/access.png";
import identityEmblem from "../../../assets/emblems/identity.png";
import type { CredentialCategory } from "@/types/vault";

type DitherEmblemProps = {
  category: CredentialCategory;
  // Laid over the emblem, for text on the dithered field.
  children?: ReactNode;
};

// The dot grids are rendered once to PNG (generated from credentialArt.ts). Drawing thousands of SVG dots
// on every card cost far more than a 10 KB image, and the look is identical.
const emblems: Record<CredentialCategory, number> = {
  banks: banksEmblem,
  access: accessEmblem,
  identity: identityEmblem,
};

// The dither grid is 960 x 480 units, so the field is 2:1.
const DITHER_ASPECT = 2;

// Full-width field at a fixed 2:1 ratio. The dither fills the whole box; the category shape sits on its right half.
export function DitherEmblem({ category, children }: DitherEmblemProps) {
  return (
    <View style={{ aspectRatio: DITHER_ASPECT, overflow: "hidden" }}>
      <Image source={emblems[category]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {children}
    </View>
  );
}
