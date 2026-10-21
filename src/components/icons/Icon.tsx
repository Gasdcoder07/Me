import { memo, type ReactNode } from 'react';
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
  | 'close'
  | 'copy'
  | 'check'
  | 'palette';

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
  copy: (
    <>
      <Rect x="9" y="9" width="11" height="11" rx="2.5" />
      <Path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </>
  ),
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  palette: (
    <>
      <Path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" />
      <Circle cx="7.5" cy="11" r="1" />
      <Circle cx="10.5" cy="7.5" r="1" />
      <Circle cx="15" cy="8" r="1" />
    </>
  ),
};

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
};

function IconBase({ name, color, size = 24 }: IconProps) {
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

// Memoized: icons sit in lists and the tab bar, and re-rendering each SVG on every parent render is wasted work.
export const Icon = memo(IconBase);
