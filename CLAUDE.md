# Mi: design rules

These rules apply to every screen and component. Read them before changing any UI.
UI copy is Spanish. Code, comments and docs are English.

## 1. Liquid, smooth motion

- Take every animation value from `src/constants/motion.ts`: `duration`, `easing`, `spring`, `timing()`.
  Do not write new duration or easing literals in components. The only exceptions are the decorative
  loops in `LavaBackground` and `SplashScreen`.
- Keep `reduceMotion: ReduceMotion.System` on every motion token. Reduce Motion must make motion instant.
- Nothing appears, disappears or changes size abruptly. Modals fade and scale, sheets slide up,
  selections and indicators spring.
- Use springs for interactive state (press, selection, indicator), so an interrupted motion keeps its velocity.
  Use timing for entrances and crossfades.
- Animate on the UI thread with shared values, `useAnimatedStyle` and `useDerivedValue`. Never drive
  motion with a `setState` per frame.
- Write shared values inside effects or derived values, never inside callbacks created during render.

## 2. Liquid UX

- Every pressable gives immediate feedback. Use `usePressScale()` (`src/hooks/usePressScale.ts`) on
  cards and circular buttons.
- Gestures track the finger (swipe, scroll, wheel). Do not snap in a way that ignores velocity.
- Keep continuity. A change shows where it came from: the tab indicator slides, the selection ring
  springs in, sheets rise from the bottom.
- No blocking spinners for local data. The data is in SQLite and reads fast, so update the screen as soon as
  the write succeeds.
- Destructive actions ask for confirmation. Credential deletion also asks for Face ID / Touch ID again.

## 3. Themes

- Two independent choices. Appearance (`light` or `dark`) applies to every color theme. The color theme
  (`niebla`, `esmeralda`, `anil`, `rosa`, `ruby`, `morado`) sets the canvas, text, focus blocks, accent and highlight,
  taken as they are from the FigCraft designs (light and dark). These six are the only color themes.
- Never hard-code a color. Use the className tokens (`bg-canvas`, `text-ink`, `text-ink-muted`, `bg-focus`,
  `text-focus-text`, `border-ink-faint`, `bg-chip`, `bg-accent`, `text-on-accent`, `text-coral`).
  When a prop needs a raw value (SVG strokes, gradients, placeholder color, animated color), use
  `const { colors } = useTheme()` from `@/theme/ThemeProvider`.
- Text colors must be legible in both appearances. Use `text-ink` / `text-ink-muted` on the canvas, and
  `text-focus-text` on focus blocks. Never use `text-focus` or `colors.focus` as a foreground color:
  in dark mode the focus block is a raised charcoal, so the text would vanish on the canvas.
- Two accent roles. `accent` (`bg-accent`, `text-on-accent`) colors the primary surfaces: the active tab,
  solid buttons and the selected toggle option. `highlight` (`bg-highlight`, `text-on-highlight`) colors item
  badges and icons. In each theme the accent is the design's main color and the highlight is its badge color.
  Never put a fixed text color on either role.
- Derive translucent colors from tokens: `withAlpha(colors.focusText, 0.1)`, `glassOnFocus(colors)`,
  and `SCRIM` for the dim layer behind modals. Do not write `rgba(...)` literals.
- Do not put colors in module-level constants or `StyleSheet.create`. They would not change with the theme.
  Compute them inside the component.
- Themes change color values only. Never change layout, sizes, spacing, radii or type for a theme or appearance.
- Adding a color token means updating five places together: `Palette` and the neutrals or accents in
  `src/constants/themes.ts`, the `@theme` block in `src/global.css`, `cssVars()` in the same file, and
  `THEME_COLOR_VARIABLES` in `metro.config.js`. A token missing from the metro list will not switch.
- Before finishing UI work, check both appearances and at least two color themes. Look at text contrast on
  focus blocks, the glass chips, the calendar chips, the accent badges and the tab bar.
- The chosen appearance and color theme are saved in `expo-sqlite/kv-store` under `appearance` and `theme`,
  and applied synchronously at launch.

## 4. Checks

- `npx tsc --noEmit` and `npx eslint src` must pass without errors.
- When a shared component changes, check it on the iOS simulator in light and dark appearance.
