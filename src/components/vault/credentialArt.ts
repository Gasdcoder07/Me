import type { CredentialCategory } from '@/types/vault';

// The emblem is a fine grid of square dots, like a printed ordered-dither halftone. Each cell is either a dot or
// empty, so the shape is drawn by how densely the dots gather, not by an outline. The field across the whole
// card fades from bright (top left) to black (bottom right); the shape sits on the right half and reads as a
// denser patch. Kept free of React Native so it can be tested in Node.
export const DITHER_COLS = 96;
export const DITHER_ROWS = 48;
export const DITHER_ASPECT = DITHER_COLS / DITHER_ROWS;

// Cells are 10 units wide in the SVG, so every dot sits on integer coordinates and the path strings stay short.
const CELL = 10;
const DOT_INSET = 1;
const DOT_SIZE = 8;
export const DITHER_VIEW_BOX = `0 0 ${DITHER_COLS * CELL} ${DITHER_ROWS * CELL}`;

// 8x8 Bayer matrix: ordered dithering gives a regular, printed-looking halftone with many grey levels.
const BAYER_8X8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

const threshold = (col: number, row: number) => (BAYER_8X8[(row % 8) * 8 + (col % 8)] + 0.5) / 64;

// Shapes are tested in their own units: x runs 0..64, y runs 0..32.
type Point = { x: number; y: number };
type Shape = (p: Point) => boolean;

const inBox = (p: Point, x0: number, y0: number, x1: number, y1: number) =>
  p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;

const inCircle = (p: Point, cx: number, cy: number, r: number) => (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r * r;

// Bancos: a classical facade, pediment over four columns, on two steps.
const bank: Shape = (p) => {
  const pediment = p.y >= 5 && p.y <= 12 && Math.abs(p.x - 32) <= ((p.y - 5) * 16) / 7;
  const columns = [19, 27, 37, 45].some((cx) => inBox(p, cx - 1.3, 15, cx + 1.3, 24));
  return (
    pediment ||
    inBox(p, 13, 12.5, 51, 14.5) ||
    columns ||
    inBox(p, 12, 24.5, 52, 26.5) ||
    inBox(p, 9, 27, 55, 29.5)
  );
};

// Accesos: a key, a ring for the bow, a shaft and two teeth.
const access: Shape = (p) => {
  const bow = (p.x - 19) ** 2 + (p.y - 16) ** 2;
  const ring = bow <= 8 * 8 && bow >= 4.5 * 4.5;
  return (
    ring ||
    inBox(p, 26, 14.6, 55, 17.4) ||
    inBox(p, 46, 17.4, 49, 21.5) ||
    inBox(p, 52, 17.4, 55, 20.5)
  );
};

// Identidad: an ID card, a frame with a head and shoulders inside.
const identity: Shape = (p) => {
  const frame = inBox(p, 8, 4, 56, 28) && !inBox(p, 9.4, 5.4, 54.6, 26.6);
  const head = inCircle(p, 32, 11.5, 4);
  const shoulders = p.y <= 25.5 && ((p.x - 32) / 11) ** 2 + ((p.y - 25.5) / 8) ** 2 <= 1;
  return frame || head || shoulders;
};

const shapes: Record<CredentialCategory, Shape> = {
  banks: bank,
  access,
  identity,
};

// The shape occupies the right half: its top-left corner is at this cell, and one shape unit is 3/4 of a cell.
const SHAPE_COL = 44;
const SHAPE_ROW = 12;
const SHAPE_UNITS_PER_CELL = 64 / 48;

// Field tone runs from the top-left corner (bright) to the bottom-right (almost black).
const FIELD_TONE_MAX = 0.3;
const FIELD_TONE_MIN = 0.03;
const fieldTone = (col: number, row: number) =>
  FIELD_TONE_MIN +
  (FIELD_TONE_MAX - FIELD_TONE_MIN) * (1 - (0.6 * (col + 0.5)) / DITHER_COLS - (0.4 * (row + 0.5)) / DITHER_ROWS);

// Shape tone runs from bright at the top of the shape to dim at the bottom, so the dithering shows inside it.
const shapeTone = (sy: number) => 1 - 0.45 * (sy / 32);

// Four sub-samples per cell give partial coverage on the edges, which the dither turns into a soft halftone.
const SAMPLES = [0.25, 0.75];

const toShapeSpace = (col: number, row: number, sx: number, sy: number): Point => ({
  x: (col + sx - SHAPE_COL) * SHAPE_UNITS_PER_CELL,
  y: (row + sy - SHAPE_ROW) * SHAPE_UNITS_PER_CELL,
});

function dotPath(col: number, row: number) {
  const x = col * CELL + DOT_INSET;
  const y = row * CELL + DOT_INSET;
  return `M${x} ${y}h${DOT_SIZE}v${DOT_SIZE}h${-DOT_SIZE}z`;
}

export type CredentialArt = {
  shape: string;
  field: string;
};

function buildArt(shape: Shape): CredentialArt {
  let shapeDots = '';
  let fieldDots = '';

  for (let row = 0; row < DITHER_ROWS; row++) {
    for (let col = 0; col < DITHER_COLS; col++) {
      let hits = 0;
      for (const sy of SAMPLES) {
        for (const sx of SAMPLES) {
          if (shape(toShapeSpace(col, row, sx, sy))) hits++;
        }
      }
      const coverage = hits / (SAMPLES.length * SAMPLES.length);
      const base = fieldTone(col, row);
      const target = coverage > 0 ? shapeTone(toShapeSpace(col, row, 0.5, 0.5).y) : base;
      const tone = base + (target - base) * coverage;

      if (tone <= threshold(col, row)) continue;
      if (coverage >= 0.5) {
        shapeDots += dotPath(col, row);
      } else {
        fieldDots += dotPath(col, row);
      }
    }
  }

  return { shape: shapeDots, field: fieldDots };
}

// Built once at load: the grid is fixed, so every card of a category reuses the same paths.
export const credentialArt: Record<CredentialCategory, CredentialArt> = {
  banks: buildArt(shapes.banks),
  access: buildArt(shapes.access),
  identity: buildArt(shapes.identity),
};
