// Regression: every (faction × building) and (faction × unit-type) mapping
// declared in portraitMap.ts must have a corresponding PNG on disk under
// public/assets/portraits/. Catches missing-asset deploys before they hit
// the HUD as a broken-image fallback.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { resolve } from 'node:path';

import {
  getBuildingPortraitUrl,
  getHeroPortraitUrl,
  getUnitPortraitUrl,
} from '../src/data/portraitMap';
import { FactionId, UnitTypeId, BuildingTypeId, HeroTypeId } from '../src/types/index';

const PUBLIC_ROOT = resolve(__dirname, '..', 'public');

function pngExists(url: string): { exists: boolean; sizeKb: number; path: string } {
  const path = resolve(PUBLIC_ROOT, url.replace(/^\//, ''));
  const exists = existsSync(path);
  const sizeKb = exists ? Math.round(statSync(path).size / 1024) : 0;
  return { exists, sizeKb, path };
}

const FACTIONS = [FactionId.Brabanders, FactionId.Randstad, FactionId.Limburgers, FactionId.Belgen];
const FACTION_NAMES: Record<FactionId, string> = {
  [FactionId.Brabanders]: 'brabant',
  [FactionId.Randstad]: 'randstad',
  [FactionId.Limburgers]: 'limburg',
  [FactionId.Belgen]: 'belgen',
};

describe('Portrait asset coverage — every mapped portrait has a PNG on disk', () => {
  describe('Buildings (4 factions × 12 building types = 48 portraits)', () => {
    const buildingTypes = [
      BuildingTypeId.TownHall,
      BuildingTypeId.Barracks,
      BuildingTypeId.LumberCamp,
      BuildingTypeId.Blacksmith,
      BuildingTypeId.Housing,
      BuildingTypeId.TertiaryResourceBuilding,
      BuildingTypeId.UpgradeBuilding,
      BuildingTypeId.FactionSpecial1,
      BuildingTypeId.FactionSpecial2,
      BuildingTypeId.DefenseTower,
      BuildingTypeId.SiegeWorkshop,
      BuildingTypeId.Bridge,
    ];

    for (const factionId of FACTIONS) {
      for (const buildingTypeId of buildingTypes) {
        const fac = FACTION_NAMES[factionId];
        const url = getBuildingPortraitUrl(factionId, buildingTypeId);
        it(`${fac} + building #${buildingTypeId} has a mapped URL and PNG file`, () => {
          expect(url, `mapping missing for ${fac}/${buildingTypeId}`).not.toBeNull();
          const { exists, path } = pngExists(url!);
          expect(exists, `PNG missing on disk: ${path}`).toBe(true);
        });
      }
    }
  });

  describe('Units (4 factions × 3-4 unit types)', () => {
    const allUnitTypes = [
      UnitTypeId.Worker,
      UnitTypeId.Infantry,
      UnitTypeId.Ranged,
      UnitTypeId.Heavy,
      UnitTypeId.Siege,
      UnitTypeId.Support,
    ];
    const factionUnitTypes: Record<FactionId, UnitTypeId[]> = {
      [FactionId.Brabanders]: allUnitTypes,
      [FactionId.Randstad]: allUnitTypes,
      [FactionId.Limburgers]: allUnitTypes,
      [FactionId.Belgen]: allUnitTypes,
    };

    for (const factionId of FACTIONS) {
      for (const unitTypeId of factionUnitTypes[factionId]) {
        const fac = FACTION_NAMES[factionId];
        const url = getUnitPortraitUrl(factionId, unitTypeId);
        it(`${fac} + unit #${unitTypeId} has a mapped URL and PNG file`, () => {
          expect(url, `mapping missing for ${fac}/${unitTypeId}`).not.toBeNull();
          const { exists, path } = pngExists(url!);
          expect(exists, `PNG missing on disk: ${path}`).toBe(true);
        });
      }
    }
  });

  describe('Heroes (8 mapped hero types)', () => {
    const heroes: HeroTypeId[] = [
      HeroTypeId.PrinsVanBrabant,
      HeroTypeId.BoerVanBrabant,
      HeroTypeId.DeCEO,
      HeroTypeId.DePoliticus,
      HeroTypeId.DeMijnwerker,
      HeroTypeId.DeVlaaibaas,
      HeroTypeId.DeChocolatier,
      HeroTypeId.DeFrituur,
    ];

    for (const heroId of heroes) {
      const url = getHeroPortraitUrl(heroId);
      it(`hero #${heroId} has a mapped URL and PNG file`, () => {
        expect(url, `mapping missing for hero ${heroId}`).not.toBeNull();
        const { exists, path } = pngExists(url!);
        expect(exists, `PNG missing on disk: ${path}`).toBe(true);
      });
    }
  });

  // Quality lock (v0.66 rewrite). Until v0.65 this was a byte-size floor
  // (buildings >= 800 KB, units >= 200 KB) that only worked because every
  // portrait was a 1024x1024 / 512x512 master. Those masters cost ~21 MB in the
  // first two minutes of a match while the HUD shows them at 28-95 CSS px.
  // The HUD set is now resized to (largest CSS display size x 2 for retina),
  // rounded up to 128/256/512:
  //   building portraits  44 px (bcard / selection panel), 28 px (build buttons) -> 128
  //   unit portraits      ~95 px (bcard train buttons), 44 px (selection)      -> 256
  //   hero portraits      ~343 px (public/updates media grid, single column)   -> 512 (untouched)
  //   command icons       ~95 px (bcard rally / fallback), 28 px (cmd-btn)     -> 256
  //   upgrade portraits   ~95 px (bcard research buttons)                      -> 256
  // The original purpose stays: catch an empty, flat or failed generation.
  // That is now checked on what matters instead of on byte count:
  //   1. dimensions >= the target (read from the PNG/JPEG header), so nothing
  //      is blurry on a dpr-2 screen;
  //   2. dimensions <= the target, so a 1024 master from a regen script cannot
  //      slip back into the HUD and re-bloat the match download (resize first);
  //   3. the decoded pixels are not one flat colour (luminance spread and
  //      distinct-colour count), plus a bytes-per-pixel floor for formats we
  //      do not decode here (some .png files are JPEG data; browsers sniff).
  describe('Painted-vignette quality lock — dimensions + not-empty', () => {
    const BUILDING_PX = 128;
    const UNIT_PX = 256;
    const HERO_PX = 512;
    const ICON_PX = 256;

    const buildingTypes = [
      BuildingTypeId.TownHall, BuildingTypeId.Barracks, BuildingTypeId.LumberCamp,
      BuildingTypeId.Blacksmith, BuildingTypeId.Housing, BuildingTypeId.TertiaryResourceBuilding,
      BuildingTypeId.UpgradeBuilding, BuildingTypeId.FactionSpecial1, BuildingTypeId.FactionSpecial2,
      BuildingTypeId.DefenseTower, BuildingTypeId.SiegeWorkshop, BuildingTypeId.Bridge,
    ];
    const allUnitTypes = [
      UnitTypeId.Worker, UnitTypeId.Infantry, UnitTypeId.Ranged,
      UnitTypeId.Heavy, UnitTypeId.Siege, UnitTypeId.Support,
    ];
    const heroes: HeroTypeId[] = [
      HeroTypeId.PrinsVanBrabant, HeroTypeId.BoerVanBrabant, HeroTypeId.DeCEO, HeroTypeId.DePoliticus,
      HeroTypeId.DeMijnwerker, HeroTypeId.DeVlaaibaas, HeroTypeId.DeChocolatier, HeroTypeId.DeFrituur,
    ];

    function dirPngs(rel: string): string[] {
      const dir = resolve(PUBLIC_ROOT, rel);
      return readdirSync(dir)
        .filter((f) => f.endsWith('.png') && !f.endsWith('.bak.png'))
        .map((f) => `/${rel}/${f}`);
    }

    function checkSet(urls: string[], targetPx: number): string[] {
      const offenders: string[] = [];
      for (const url of urls) {
        const { path } = pngExists(url);
        const buf = readFileSync(path);
        const problem = imageProblem(buf, targetPx);
        if (problem) offenders.push(`${path}: ${problem}`);
      }
      return offenders;
    }

    it(`all 48 building portraits are ${BUILDING_PX}px and not flat`, () => {
      const urls: string[] = [];
      for (const f of FACTIONS) for (const b of buildingTypes) urls.push(getBuildingPortraitUrl(f, b)!);
      const offenders = checkSet(urls, BUILDING_PX);
      expect(offenders, `bad building portraits:\n${offenders.join('\n')}`).toEqual([]);
    });

    it(`all unit portraits are ${UNIT_PX}px and not flat`, () => {
      const urls: string[] = [];
      for (const f of FACTIONS) for (const u of allUnitTypes) urls.push(getUnitPortraitUrl(f, u)!);
      const offenders = checkSet(urls, UNIT_PX);
      expect(offenders, `bad unit portraits:\n${offenders.join('\n')}`).toEqual([]);
    });

    it(`all hero portraits stay ${HERO_PX}px (also shown large on /updates/) and not flat`, () => {
      const offenders = checkSet(heroes.map((h) => getHeroPortraitUrl(h)!), HERO_PX);
      expect(offenders, `bad hero portraits:\n${offenders.join('\n')}`).toEqual([]);
    });

    it(`all HUD command icons are ${ICON_PX}px and not flat`, () => {
      const urls = dirPngs('assets/ui/commands');
      expect(urls.length).toBeGreaterThan(30);
      const offenders = checkSet(urls, ICON_PX);
      expect(offenders, `bad command icons:\n${offenders.join('\n')}`).toEqual([]);
    });

    it(`all upgrade portraits are ${ICON_PX}px and not flat`, () => {
      const urls = dirPngs('assets/portraits/upgrades');
      expect(urls.length).toBeGreaterThan(60);
      const offenders = checkSet(urls, ICON_PX);
      expect(offenders, `bad upgrade portraits:\n${offenders.join('\n')}`).toEqual([]);
    });
  });

  describe('Multi-select portraits scale to their 28px tile', () => {
    // Before v0.66 play/index.html had no `.multi-portrait img` rule (the one in
    // src/ui/hud.css is not loaded), so the multi-select tiles showed a 512px
    // portrait at natural size, cropped to its top-left corner.
    it('play/index.html sizes .multi-portrait img to 100% with object-fit cover', () => {
      const html = readFileSync(resolve(__dirname, '..', 'play', 'index.html'), 'utf8');
      const rule = html.match(/\.multi-portrait img\s*\{([^}]*)\}/);
      expect(rule, '.multi-portrait img rule missing').not.toBeNull();
      expect(rule![1]).toMatch(/width:\s*100%/);
      expect(rule![1]).toMatch(/height:\s*100%/);
      expect(rule![1]).toMatch(/object-fit:\s*cover/);
    });
  });

  describe('Quality-lock helpers detect what the old byte floor caught', () => {
    it('reads PNG and JPEG header dimensions', () => {
      expect(imageSize(makePng(128, 96, () => [1, 2, 3]))).toEqual({ format: 'png', width: 128, height: 96 });
      expect(imageSize(makeJpegHeader(256, 200))).toEqual({ format: 'jpeg', width: 256, height: 200 });
    });

    it('decodes PNG pixels exactly (None + Paeth filtered rows)', () => {
      const f = (x: number, y: number): [number, number, number] => [(x * 5 + y) % 256, (y * 9) % 256, (x ^ y) % 256];
      const px = decodePng(makePng(17, 9, f))!;
      expect(px.channels).toBe(3);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 17; x++) {
        expect([...px.data.subarray((y * 17 + x) * 3, (y * 17 + x) * 3 + 3)]).toEqual(f(x, y));
      }
    });

    it('flags a flat single-colour image (failed / placeholder generation)', () => {
      const flat = makePng(128, 128, () => [40, 40, 40]);
      expect(imageProblem(flat, 128)).toMatch(/flat|bytes\/px/);
    });

    it('flags too-small (blurry on retina) and too-large (bandwidth) images', () => {
      const noisy = (w: number) => makePng(w, w, (x, y) => [(x * 37 + y * 11) % 256, (x * 7 ^ y * 13) % 256, (x * y) % 256]);
      expect(imageProblem(noisy(64), 128)).toMatch(/smaller than 128/);
      expect(imageProblem(noisy(512), 128)).toMatch(/larger than 128/);
      expect(imageProblem(noisy(128), 128)).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Minimal image inspection (no image dependency in package.json).

function imageSize(buf: Buffer): { format: 'png' | 'jpeg'; width: number; height: number } | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47 && buf.toString('ascii', 12, 16) === 'IHDR') {
    return { format: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC) carry the frame size.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { format: 'jpeg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Decode an 8-bit, non-interlaced RGB/RGBA/grey PNG to RGB(A) rows. Returns null for other layouts. */
function decodePng(buf: Buffer): { width: number; height: number; channels: number; data: Uint8Array } | null {
  const size = imageSize(buf);
  if (!size || size.format !== 'png') return null;
  const bitDepth = buf[24], colorType = buf[25], interlace = buf[28];
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (bitDepth !== 8 || interlace !== 0 || !channels) return null;
  const idat: Buffer[] = [];
  let i = 8;
  while (i < buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.toString('ascii', i + 4, i + 8);
    if (type === 'IDAT') idat.push(buf.subarray(i + 8, i + 8 + len));
    if (type === 'IEND') break;
    i += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const { width, height } = size;
  const stride = width * channels;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[dst + x - channels] : 0;
      const b = y > 0 ? out[dst - stride + x] : 0;
      const c = x >= channels && y > 0 ? out[dst - stride + x - channels] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[dst + x] = v & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

/** Returns a reason string when the image fails the quality lock for `targetPx`, else null. */
function imageProblem(buf: Buffer, targetPx: number): string | null {
  const size = imageSize(buf);
  if (!size) return 'unreadable image header';
  const longest = Math.max(size.width, size.height);
  if (longest < targetPx) return `${size.width}x${size.height} smaller than ${targetPx}px (blurry at dpr 2)`;
  if (longest > targetPx) return `${size.width}x${size.height} larger than ${targetPx}px (resize before shipping)`;
  // Flat fills compress to ~0.01 byte/px; the lightest real icon (alpha cut-out) sits at ~0.2.
  const bpp = buf.length / (size.width * size.height);
  if (bpp < 0.1) return `${bpp.toFixed(3)} bytes/px — looks empty`;
  const px = decodePng(buf);
  if (px) {
    const colours = new Set<number>();
    let sum = 0, sumSq = 0, n = 0;
    for (let o = 0; o < px.data.length; o += px.channels) {
      const r = px.data[o], g = px.channels >= 3 ? px.data[o + 1] : r, b = px.channels >= 3 ? px.data[o + 2] : r;
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += l; sumSq += l * l; n++;
      colours.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
    }
    const sd = Math.sqrt(Math.max(0, sumSq / n - (sum / n) ** 2));
    if (sd < 8 || colours.size < 256) return `flat image (luminance sd ${sd.toFixed(1)}, ${colours.size} colours)`;
  }
  return null;
}

// --- tiny encoders for the helper self-tests -------------------------------

function crc32(bytes: Buffer): number {
  let c = ~0;
  for (const byte of bytes) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function makePng(w: number, h: number, px: (x: number, y: number) => [number, number, number]): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = y % 2 === 0 ? 0 : 4; // alternate filter None / Paeth so the decoder is exercised
    for (let x = 0; x < w; x++) {
      const [r, g, b] = px(x, y);
      raw.set([r, g, b], y * (w * 3 + 1) + 1 + x * 3);
    }
  }
  // Rows tagged Paeth must hold residuals: re-encode them against the previous row.
  for (let y = 1; y < h; y += 2) {
    const row = y * (w * 3 + 1) + 1, prev = (y - 1) * (w * 3 + 1) + 1;
    const orig = Buffer.from(raw.subarray(row, row + w * 3));
    for (let x = 0; x < w * 3; x++) {
      const a = x >= 3 ? orig[x - 3] : 0, b = raw[prev + x], c = x >= 3 ? raw[prev + x - 3] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      raw[row + x] = (orig[x] - pred) & 0xff;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function makeJpegHeader(w: number, h: number): Buffer {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const sof = Buffer.from([0xff, 0xc2, 0x00, 0x11, 8, h >> 8, h & 0xff, w >> 8, w & 0xff, 3, 1, 0x11, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof, Buffer.from([0xff, 0xd9])]);
}
