// Course thumbnail artwork: calm, flat, geometric compositions in the Lampstand
// palette (evergreen, parchment, dusk blue, olive, a little gold). No text.
import sharp from "sharp";
import type { ThumbnailMotif } from "./types";

export const THUMB_WIDTH = 1600;
export const THUMB_HEIGHT = 900;

const C = {
  evergreen: "#1F3D33",
  pine: "#16302A",
  moss: "#2F5546",
  sage: "#8DA48F",
  olive: "#767B43",
  oliveLight: "#A3A66B",
  sand: "#E6D7BC",
  parchment: "#F4EDE1",
  wheat: "#D8C29B",
  dusk: "#2B3F57",
  duskLight: "#4A6382",
  mist: "#9FB2C4",
  gold: "#C9A45C",
  clay: "#B7784F",
};

function svg(body: string, background: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" viewBox="0 0 1600 900">
<rect width="1600" height="900" fill="${background}"/>
${body}
</svg>`;
}

const ART: Record<ThumbnailMotif, () => string> = {
  // Foundations of Faith: a sun rising over layered hills.
  sunrise: () =>
    svg(
      `
<g fill="none" stroke="${C.wheat}" stroke-width="6" opacity="0.55">
  <circle cx="800" cy="640" r="330"/>
  <circle cx="800" cy="640" r="430"/>
  <circle cx="800" cy="640" r="530"/>
</g>
<circle cx="800" cy="640" r="230" fill="${C.gold}"/>
<path d="M0 620 C 300 540 520 600 800 640 C 1080 680 1300 560 1600 600 L1600 900 L0 900 Z" fill="${C.sage}"/>
<path d="M0 720 C 280 660 560 740 860 720 C 1160 700 1360 650 1600 690 L1600 900 L0 900 Z" fill="${C.moss}"/>
<path d="M0 810 C 400 770 900 830 1600 790 L1600 900 L0 900 Z" fill="${C.evergreen}"/>`,
      C.parchment,
    ),

  // Walking Through Romans: an open book beneath a single light.
  "open-book": () =>
    svg(
      `
<circle cx="800" cy="250" r="70" fill="${C.gold}"/>
<g fill="none" stroke="${C.gold}" stroke-width="4" opacity="0.35">
  <circle cx="800" cy="250" r="120"/>
  <circle cx="800" cy="250" r="175"/>
</g>
<path d="M800 470 C 680 400 480 390 300 430 L300 760 C 480 720 680 730 800 800 Z" fill="${C.parchment}"/>
<path d="M800 470 C 920 400 1120 390 1300 430 L1300 760 C 1120 720 920 730 800 800 Z" fill="${C.sand}"/>
<g stroke="${C.wheat}" stroke-width="5" fill="none" stroke-linecap="round">
  <path d="M380 500 C 500 480 620 485 730 520"/>
  <path d="M380 560 C 500 540 620 545 730 580"/>
  <path d="M380 620 C 500 600 620 605 730 640"/>
  <path d="M870 520 C 980 485 1100 480 1220 500"/>
  <path d="M870 580 C 980 545 1100 540 1220 560"/>
  <path d="M870 640 C 980 605 1100 600 1220 620"/>
</g>
<path d="M800 470 L800 800" stroke="${C.wheat}" stroke-width="6"/>`,
      C.evergreen,
    ),

  // The Sermon on the Mount: layered mountains under a pale sun.
  mountain: () =>
    svg(
      `
<circle cx="1180" cy="250" r="110" fill="${C.sand}"/>
<path d="M-50 900 L520 300 L1000 900 Z" fill="${C.duskLight}"/>
<path d="M420 900 L980 260 L1650 900 Z" fill="${C.moss}"/>
<path d="M980 260 L1110 408 L1030 390 L960 440 L890 380 L840 420 Z" fill="${C.parchment}" opacity="0.9"/>
<path d="M0 760 C 300 700 600 760 900 730 C 1200 700 1400 740 1600 720 L1600 900 L0 900 Z" fill="${C.olive}"/>
<path d="M0 840 C 500 800 1000 850 1600 820 L1600 900 L0 900 Z" fill="${C.evergreen}"/>`,
      C.mist,
    ),

  // Prayer That Shapes Us: ripples spreading from a single point.
  ripples: () =>
    svg(
      `
<g fill="none" stroke="${C.sand}">
  <circle cx="800" cy="450" r="90" stroke-width="5" opacity="0.9"/>
  <circle cx="800" cy="450" r="170" stroke-width="5" opacity="0.7"/>
  <circle cx="800" cy="450" r="260" stroke-width="4" opacity="0.5"/>
  <circle cx="800" cy="450" r="360" stroke-width="4" opacity="0.35"/>
  <circle cx="800" cy="450" r="470" stroke-width="3" opacity="0.22"/>
  <circle cx="800" cy="450" r="590" stroke-width="3" opacity="0.14"/>
  <circle cx="800" cy="450" r="720" stroke-width="2" opacity="0.08"/>
</g>
<circle cx="800" cy="450" r="30" fill="${C.gold}"/>`,
      C.dusk,
    ),

  // Servant Leadership: a basin and a folded towel.
  basin: () =>
    svg(
      `
<rect x="0" y="640" width="1600" height="260" fill="${C.wheat}"/>
<ellipse cx="760" cy="520" rx="330" ry="70" fill="${C.mist}"/>
<g fill="none" stroke="${C.parchment}" stroke-width="5" opacity="0.8" stroke-linecap="round">
  <path d="M620 515 C 680 500 740 530 800 515"/>
  <path d="M720 545 C 780 530 840 560 900 545"/>
</g>
<path d="M430 520 C 440 680 560 760 760 760 C 960 760 1080 680 1090 520 C 1000 590 520 590 430 520 Z" fill="${C.evergreen}"/>
<ellipse cx="760" cy="790" rx="220" ry="22" fill="${C.olive}" opacity="0.45"/>
<path d="M1040 470 C 1120 440 1220 450 1270 500 L1290 760 C 1240 720 1150 715 1080 740 Z" fill="${C.parchment}"/>
<path d="M1080 740 C 1150 715 1240 720 1290 760 L1290 790 C 1230 760 1150 760 1080 780 Z" fill="${C.clay}"/>`,
      C.sand,
    ),

  // Christ-Centered Marriage: two interlocking rings.
  rings: () =>
    svg(
      `
<circle cx="660" cy="450" r="230" fill="none" stroke="${C.evergreen}" stroke-width="44"/>
<circle cx="940" cy="450" r="230" fill="none" stroke="${C.gold}" stroke-width="44"/>
<path d="M 757.2 241.6 A 230 230 0 0 1 836.2 302.2" fill="none" stroke="${C.evergreen}" stroke-width="44"/>
<g fill="${C.olive}" opacity="0.5">
  <circle cx="230" cy="180" r="10"/><circle cx="1370" cy="720" r="10"/><circle cx="1420" cy="180" r="6"/><circle cx="180" cy="740" r="6"/>
</g>`,
      C.parchment,
    ),

  // Welcome to Grace Harbor: a lighthouse over calm water.
  harbor: () =>
    svg(
      `
<path d="M1060 330 L1600 160 L1600 420 Z" fill="${C.gold}" opacity="0.28"/>
<circle cx="380" cy="230" r="70" fill="${C.sand}" opacity="0.9"/>
<rect x="0" y="600" width="1600" height="300" fill="${C.duskLight}"/>
<g stroke="${C.mist}" stroke-width="5" stroke-linecap="round" opacity="0.7">
  <path d="M180 680 L400 680"/><path d="M520 740 L820 740"/><path d="M260 810 L460 810"/><path d="M1240 700 L1460 700"/><path d="M980 800 L1260 800"/>
</g>
<path d="M880 600 L960 470 L1180 470 L1260 600 Z" fill="${C.evergreen}"/>
<path d="M1010 470 L1030 250 L1110 250 L1130 470 Z" fill="${C.parchment}"/>
<rect x="1018" y="330" width="104" height="36" fill="${C.clay}"/>
<rect x="1022" y="400" width="96" height="36" fill="${C.clay}"/>
<rect x="1035" y="205" width="70" height="45" fill="${C.gold}"/>
<path d="M1025 205 L1070 160 L1115 205 Z" fill="${C.evergreen}"/>
<path d="M430 640 L620 640 L590 680 L460 680 Z" fill="${C.parchment}"/>
<path d="M520 640 L520 540 L590 630 Z" fill="${C.sand}"/>`,
      C.dusk,
    ),

  // Kids Ministry Volunteer Training: seedlings growing toward the sun.
  seedlings: () => {
    const sprouts = [
      { x: 330, h: 170, s: 1 },
      { x: 560, h: 260, s: 1.2 },
      { x: 800, h: 340, s: 1.4 },
      { x: 1040, h: 240, s: 1.15 },
      { x: 1270, h: 190, s: 1 },
    ];
    const base = 700;
    const plants = sprouts
      .map(({ x, h, s }) => {
        const top = base - h;
        return `<path d="M${x} ${base} C ${x - 10} ${base - h / 2} ${x + 10} ${top + 40} ${x} ${top}" stroke="${C.moss}" stroke-width="${10 * s}" fill="none" stroke-linecap="round"/>
<ellipse cx="${x - 48 * s}" cy="${top + 10}" rx="${52 * s}" ry="${22 * s}" fill="${C.olive}" transform="rotate(-28 ${x - 48 * s} ${top + 10})"/>
<ellipse cx="${x + 48 * s}" cy="${top - 4}" rx="${52 * s}" ry="${22 * s}" fill="${C.sage}" transform="rotate(28 ${x + 48 * s} ${top - 4})"/>`;
      })
      .join("\n");
    return svg(
      `
<circle cx="1300" cy="200" r="90" fill="${C.gold}"/>
${plants}
<path d="M0 690 C 400 670 1200 710 1600 685 L1600 900 L0 900 Z" fill="${C.clay}"/>
<path d="M0 780 C 500 760 1100 800 1600 770 L1600 900 L0 900 Z" fill="${C.evergreen}"/>`,
      C.parchment,
    );
  },

  // Faith That Holds: an anchor beneath gentle waves.
  anchor: () =>
    svg(
      `
<g fill="none" stroke="${C.duskLight}" stroke-width="6" stroke-linecap="round">
  <path d="M0 150 C 100 120 200 180 300 150 S 500 120 600 150 S 800 180 900 150 S 1100 120 1200 150 S 1400 180 1600 150"/>
  <path d="M0 220 C 100 190 200 250 300 220 S 500 190 600 220 S 800 250 900 220 S 1100 190 1200 220 S 1400 250 1600 220"/>
</g>
<g fill="none" stroke="${C.sand}" stroke-width="34" stroke-linecap="round">
  <circle cx="800" cy="300" r="52"/>
  <path d="M800 352 L800 760"/>
  <path d="M690 440 L910 440"/>
  <path d="M560 600 C 580 720 690 770 800 770 C 910 770 1020 720 1040 600"/>
</g>
<path d="M530 620 L560 560 L600 625 Z" fill="${C.sand}"/>
<path d="M1070 620 L1040 560 L1000 625 Z" fill="${C.sand}"/>
<rect x="0" y="840" width="1600" height="60" fill="${C.moss}"/>`,
      C.dusk,
    ),

  // Reading the Bible in a Year: a winding road toward the horizon.
  path: () =>
    svg(
      `
<rect x="0" y="0" width="1600" height="420" fill="${C.parchment}"/>
<circle cx="820" cy="380" r="90" fill="${C.gold}"/>
<path d="M0 420 C 300 380 500 430 800 410 C 1100 390 1300 420 1600 400 L1600 900 L0 900 Z" fill="${C.sage}"/>
<path d="M0 560 C 400 520 700 600 1000 560 C 1250 530 1450 560 1600 540 L1600 900 L0 900 Z" fill="${C.olive}"/>
<path d="M0 720 C 400 690 900 760 1600 700 L1600 900 L0 900 Z" fill="${C.evergreen}"/>
<path d="M820 418 C 860 470 700 520 760 580 C 830 650 1100 660 1000 760 C 940 820 700 860 640 900" fill="none" stroke="${C.sand}" stroke-width="46" stroke-linecap="round"/>
<path d="M820 418 C 860 470 700 520 760 580 C 830 650 1100 660 1000 760 C 940 820 700 860 640 900" fill="none" stroke="${C.wheat}" stroke-width="6" stroke-dasharray="26 30"/>`,
      C.parchment,
    ),

  // Leading a Small Group: a circle of people around a table.
  "circle-table": () => {
    const colors = [C.gold, C.sand, C.sage, C.clay, C.mist, C.oliveLight, C.parchment, C.wheat];
    const seats = colors
      .map((color, i) => {
        const a = (i / colors.length) * Math.PI * 2 - Math.PI / 2;
        const x = 800 + Math.cos(a) * 300;
        const y = 450 + Math.sin(a) * 300;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="58" fill="${color}"/>`;
      })
      .join("\n");
    return svg(
      `
<circle cx="800" cy="450" r="400" fill="none" stroke="${C.moss}" stroke-width="3"/>
<circle cx="800" cy="450" r="190" fill="${C.moss}"/>
<circle cx="800" cy="450" r="34" fill="${C.gold}"/>
${seats}`,
      C.evergreen,
    );
  },

  // Discovering Your Spiritual Gifts: a dove with an olive sprig.
  dove: () =>
    svg(
      `
<circle cx="800" cy="450" r="330" fill="${C.duskLight}" opacity="0.6"/>
<path d="M560 520 C 640 430 760 420 860 450 C 940 470 1010 440 1060 400 C 1040 470 990 520 920 540 C 840 565 720 580 560 520 Z" fill="${C.parchment}"/>
<path d="M740 470 C 700 360 720 260 820 200 C 840 290 860 380 840 460 Z" fill="${C.sand}"/>
<path d="M800 455 C 830 350 900 270 1010 250 C 980 340 930 420 860 470 Z" fill="${C.parchment}"/>
<circle cx="1015" cy="420" r="8" fill="${C.dusk}"/>
<path d="M1060 400 L1110 410 L1062 425 Z" fill="${C.gold}"/>
<path d="M1100 418 C 1140 450 1170 480 1190 520" stroke="${C.oliveLight}" stroke-width="6" fill="none"/>
<ellipse cx="1150" cy="455" rx="22" ry="9" fill="${C.oliveLight}" transform="rotate(40 1150 455)"/>
<ellipse cx="1178" cy="492" rx="22" ry="9" fill="${C.oliveLight}" transform="rotate(60 1178 492)"/>
<ellipse cx="1125" cy="440" rx="20" ry="8" fill="${C.sage}" transform="rotate(-10 1125 440)"/>`,
      C.dusk,
    ),
};

/** Renders a motif to a 1600×900 WebP. */
export async function renderThumbnail(motif: ThumbnailMotif): Promise<Buffer> {
  return sharp(Buffer.from(ART[motif]())).webp({ quality: 86 }).toBuffer();
}
