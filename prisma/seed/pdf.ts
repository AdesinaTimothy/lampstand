// Renders StudyGuide content into a clean, printable US Letter PDF with pdf-lib.
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import type { StudyGuide } from "./types";

const PAGE = { width: 612, height: 792 };
const MARGIN = { x: 64, top: 72, bottom: 72 };
const CONTENT_WIDTH = PAGE.width - MARGIN.x * 2;

const INK = rgb(0.13, 0.15, 0.14);
const MUTED = rgb(0.38, 0.4, 0.38);
const EVERGREEN = rgb(0.122, 0.239, 0.2);
const GOLD = rgb(0.79, 0.64, 0.36);
const PARCHMENT = rgb(0.957, 0.929, 0.882);

/** Standard PDF fonts only encode WinAnsi; map the few characters that aren't covered. */
function winAnsi(text: string): string {
  return text
    .replace(/[‐‑‒]/g, "-")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E -ÿ–—‘’“”•…]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderStudyGuide(guide: StudyGuide, organizationName: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(guide.title);
  doc.setAuthor(organizationName);
  doc.setSubject(guide.subtitle);
  doc.setCreator("Lampstand");
  doc.setProducer("Lampstand");

  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN.top;

  const newPage = () => {
    page = doc.addPage([PAGE.width, PAGE.height]);
    y = PAGE.height - MARGIN.top;
  };
  const ensure = (height: number) => {
    if (y - height < MARGIN.bottom) newPage();
  };
  const paragraph = (text: string, opts: { font?: PDFFont; size?: number; color?: typeof INK; indent?: number; gap?: number } = {}) => {
    const font = opts.font ?? serif;
    const size = opts.size ?? 11.5;
    const indent = opts.indent ?? 0;
    const leading = size * 1.45;
    const lines = wrap(text, font, size, CONTENT_WIDTH - indent);
    // Keep short paragraphs together rather than stranding a line on the next page.
    if (lines.length <= 6) ensure(lines.length * leading);
    for (const line of lines) {
      ensure(leading);
      page.drawText(line, { x: MARGIN.x + indent, y: y - size, size, font, color: opts.color ?? INK });
      y -= leading;
    }
    y -= opts.gap ?? 8;
  };

  // Header band.
  page.drawRectangle({ x: 0, y: PAGE.height - 150, width: PAGE.width, height: 150, color: EVERGREEN });
  page.drawRectangle({ x: MARGIN.x, y: PAGE.height - 154, width: 56, height: 4, color: GOLD });
  page.drawText(winAnsi(guide.subtitle.toUpperCase()), {
    x: MARGIN.x,
    y: PAGE.height - 58,
    size: 8.5,
    font: sansBold,
    color: GOLD,
  });
  let titleY = PAGE.height - 88;
  for (const line of wrap(guide.title, serifBold, 24, CONTENT_WIDTH)) {
    page.drawText(line, { x: MARGIN.x, y: titleY, size: 24, font: serifBold, color: PARCHMENT });
    titleY -= 28;
  }
  y = PAGE.height - 190;

  if (guide.scripture) {
    const lines = wrap(`“${guide.scripture.text}”`, serifItalic, 13, CONTENT_WIDTH - 36);
    const boxHeight = lines.length * 19 + 40;
    page.drawRectangle({ x: MARGIN.x, y: y - boxHeight, width: CONTENT_WIDTH, height: boxHeight, color: PARCHMENT });
    page.drawRectangle({ x: MARGIN.x, y: y - boxHeight, width: 3, height: boxHeight, color: GOLD });
    let qy = y - 26;
    for (const line of lines) {
      page.drawText(line, { x: MARGIN.x + 18, y: qy, size: 13, font: serifItalic, color: INK });
      qy -= 19;
    }
    page.drawText(winAnsi(guide.scripture.reference), { x: MARGIN.x + 18, y: qy - 2, size: 9.5, font: sansBold, color: EVERGREEN });
    y -= boxHeight + 28;
  }

  for (const section of guide.sections) {
    ensure(60);
    page.drawText(winAnsi(section.heading), { x: MARGIN.x, y: y - 15, size: 15, font: serifBold, color: EVERGREEN });
    y -= 28;
    for (const p of section.paragraphs) paragraph(p);
    for (const bullet of section.bullets ?? []) {
      const lines = wrap(bullet, serif, 11.5, CONTENT_WIDTH - 22);
      lines.forEach((line, i) => {
        ensure(17);
        if (i === 0) page.drawCircle({ x: MARGIN.x + 8, y: y - 8, size: 2.2, color: GOLD });
        page.drawText(line, { x: MARGIN.x + 22, y: y - 11.5, size: 11.5, font: serif, color: INK });
        y -= 16.7;
      });
      y -= 3;
    }
    y -= 10;
  }

  if (guide.questions.length) {
    ensure(70);
    page.drawRectangle({ x: MARGIN.x, y: y - 2, width: CONTENT_WIDTH, height: 1, color: GOLD });
    y -= 14;
    page.drawText("For reflection and discussion", { x: MARGIN.x, y: y - 15, size: 15, font: serifBold, color: EVERGREEN });
    y -= 30;
    guide.questions.forEach((q, i) => {
      const lines = wrap(q, serif, 11.5, CONTENT_WIDTH - 26);
      lines.forEach((line, j) => {
        ensure(17);
        if (j === 0) page.drawText(`${i + 1}.`, { x: MARGIN.x, y: y - 11.5, size: 11.5, font: sansBold, color: EVERGREEN });
        page.drawText(line, { x: MARGIN.x + 26, y: y - 11.5, size: 11.5, font: serif, color: INK });
        y -= 16.7;
      });
      // Space to write.
      y -= 30;
    });
  }

  if (guide.closing) {
    y -= 4;
    paragraph(guide.closing, { font: serifItalic, size: 12, color: MUTED });
  }

  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(winAnsi(`${organizationName} · ${guide.subtitle.split("·")[0].trim()}`), {
      x: MARGIN.x,
      y: 36,
      size: 8.5,
      font: sans,
      color: MUTED,
    });
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, {
      x: PAGE.width - MARGIN.x - sans.widthOfTextAtSize(label, 8.5),
      y: 36,
      size: 8.5,
      font: sans,
      color: MUTED,
    });
  });

  return Buffer.from(await doc.save());
}
