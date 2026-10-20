/**
 * Draws the Tempo app icons as PNG files with no image dependencies:
 * a tangerine open ring (the Tempo mark) on near-black ink.
 * Run with `npm run icons`. Output goes to public/icons/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/icons');
const BG = [0x0c, 0x0d, 0x12];
const MARK = [0xff, 0x8a, 0x3d];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(size: number, rgba: Uint8Array): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Coverage (0..1) of the shape at a point in unit coordinates (0..1). */
function shape(
  x: number,
  y: number,
  opts: { rounded: boolean; scale: number },
): { bg: number; mark: number } {
  const r = 0.22; // corner radius for the rounded variant
  let bg = 1;
  if (opts.rounded) {
    const dx = Math.max(r - x, 0, x - (1 - r));
    const dy = Math.max(r - y, 0, y - (1 - r));
    bg = dx * dx + dy * dy <= r * r ? 1 : 0;
  }
  // Open ring: radius 0.3, thickness 0.11, gap of 90 degrees at the top right.
  const cx = (x - 0.5) / opts.scale;
  const cy = (y - 0.5) / opts.scale;
  const dist = Math.hypot(cx, cy);
  const angle = Math.atan2(-cy, cx); // 0 = right, PI/2 = up
  const inGap = angle > 0 && angle < Math.PI / 2;
  const onRing = Math.abs(dist - 0.3) <= 0.055 && !inGap;
  // Rounded ends on the ring.
  const ends = [
    [0.3, 0],
    [0, -0.3],
  ].some(([ex, ey]) => Math.hypot(cx - ex, cy - ey) <= 0.055);
  const dot = dist <= 0.075;
  return { bg, mark: onRing || ends || dot ? 1 : 0 };
}

function draw(size: number, opts: { rounded: boolean; scale: number }): Buffer {
  const samples = 4;
  const rgba = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let mark = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const s = shape(
            (px + (sx + 0.5) / samples) / size,
            (py + (sy + 0.5) / samples) / size,
            opts,
          );
          bg += s.bg;
          mark += s.mark * s.bg;
        }
      }
      const n = samples * samples;
      const a = bg / n;
      const m = bg === 0 ? 0 : mark / bg;
      const i = (py * size + px) * 4;
      for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(BG[c] * (1 - m) + MARK[c] * m);
      rgba[i + 3] = Math.round(a * 255);
    }
  }
  return encodePng(size, rgba);
}

mkdirSync(outDir, { recursive: true });
const files: Array<[string, number, { rounded: boolean; scale: number }]> = [
  ['icon-192.png', 192, { rounded: true, scale: 1 }],
  ['icon-512.png', 512, { rounded: true, scale: 1 }],
  // Maskable icons fill the square; the mark stays inside the 80% safe zone.
  ['icon-maskable-512.png', 512, { rounded: false, scale: 0.8 }],
  // iOS adds its own rounded corners.
  ['apple-touch-icon.png', 180, { rounded: false, scale: 0.9 }],
];
for (const [name, size, opts] of files) {
  writeFileSync(resolve(outDir, name), draw(size, opts));
  console.log(`icons: wrote public/icons/${name}`);
}
