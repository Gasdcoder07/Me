import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'plus'
  | 'vault'
  | 'files'
  | 'clock'
  | 'key'
  | 'bank'
  | 'id'
  | 'book'
  | 'chevron'
  | 'trash'
  | 'close';

// Thin line icons on a 24-unit grid, drawn with simple geometric primitives.
const shapes: Record<IconName, ReactNode> = {
  plus: (
    <>
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </>
  ),
  vault: (
    <>
      <Rect x="4" y="4" width="16" height="16" rx="5" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  files: (
    <>
      <Path d="M7 3h7l5 5v13H7z" />
      <Path d="M14 3v5h5" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  key: (
    <>
      <Circle cx="8" cy="15" r="4" />
      <Path d="M11 12l8-8" />
      <Path d="M16 7l3 3" />
      <Path d="M14 9l2 2" />
    </>
  ),
  bank: (
    <>
      <Path d="M3 9.5L12 4l9 5.5" />
      <Path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
      <Path d="M3 20.5h18" />
    </>
  ),
  id: (
    <>
      <Rect x="3" y="5" width="18" height="14" rx="3" />
      <Circle cx="9" cy="11" r="2" />
      <Path d="M14.5 10h3M14.5 14h3" />
    </>
  ),
  book: (
    <>
      <Path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <Path d="M5 17a3 3 0 0 1 3-3h11" />
    </>
  ),
  chevron: <Path d="M6 9l6 6 6-6" />,
  trash: (
    <>
      <Path d="M4 7h16" />
      <Path d="M9 7V4h6v3" />
      <Path d="M6 7l1 13h10l1-13" />
    </>
  ),
  close: (
    <>
      <Path d="M6 6l12 12" />
      <Path d="M18 6L6 18" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
};

export function Icon({ name, color, size = 24 }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </Svg>
  );
}
