import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type CertificatePdfInput = {
  code: string;
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  instructorName: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  completedAt: Date;
  verifyUrl: string;
};

const FONT_DIR = path.join(process.cwd(), "src/server/certificates/fonts");
let fontCache: Promise<Record<"display" | "italic" | "sans" | "sansBold", Uint8Array>> | null = null;
function loadFonts() {
  fontCache ??= Promise.all(
    ["Newsreader-Medium.ttf", "Newsreader-Italic.ttf", "Geist-Regular.ttf", "Geist-SemiBold.ttf"].map((f) => readFile(path.join(FONT_DIR, f))),
  ).then(([display, italic, sans, sansBold]) => ({ display: display!, italic: italic!, sans: sans!, sansBold: sansBold! }));
  return fontCache;
}

// Brand colours (match the web certificate).
const INK = rgb(0.094, 0.129, 0.118);
const MUTED = rgb(0.36, 0.41, 0.39);
const PRIMARY = rgb(0.122, 0.318, 0.271);
const GOLD = rgb(0.659, 0.455, 0.141);
const PAPER = rgb(0.988, 0.98, 0.961);

/** Returns the first font that can render every character (names can be in any Latin script). */
function pickFont(text: string, ...fonts: PDFFont[]): PDFFont {
  for (const f of fonts) {
    const set = new Set(f.getCharacterSet());
    if ([...text].every((ch) => ch === " " || set.has(ch.codePointAt(0)!))) return f;
  }
  return fonts[fonts.length - 1]!;
}

function safeText(text: string, font: PDFFont) {
  const set = new Set(font.getCharacterSet());
  return [...text].map((ch) => (ch === " " || set.has(ch.codePointAt(0)!) ? ch : "?")).join("");
}

function centered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = INK, maxWidth = 640) {
  let s = size;
  const t = safeText(text, font);
  while (font.widthOfTextAtSize(t, s) > maxWidth && s > 10) s -= 1;
  const w = font.widthOfTextAtSize(t, s);
  page.drawText(t, { x: (page.getWidth() - w) / 2, y, size: s, font, color });
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const bytes = await loadFonts();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Certificate of Completion — ${input.courseTitle}`);
  doc.setAuthor(input.organizationName);
  doc.setSubject(`Awarded to ${input.recipientName}`);
  doc.setCreator("Lampstand");
  doc.setKeywords(["certificate", input.code]);

  const [display, italic, sans, sansBold] = await Promise.all([
    doc.embedFont(bytes.display, { subset: true }),
    doc.embedFont(bytes.italic, { subset: true }),
    doc.embedFont(bytes.sans, { subset: true }),
    doc.embedFont(bytes.sansBold, { subset: true }),
  ]);

  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const W = page.getWidth();
  const H = page.getHeight();

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: PRIMARY, borderWidth: 2 });
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 0.6 });

  // Lamp mark: a simple flame over a base, echoing the logo.
  const cx = W / 2;
  page.drawEllipse({ x: cx, y: H - 82, xScale: 7, yScale: 12, color: GOLD });
  page.drawRectangle({ x: cx - 14, y: H - 104, width: 28, height: 5, color: PRIMARY });

  centered(page, input.organizationName.toUpperCase(), H - 132, sansBold, 10.5, PRIMARY);
  centered(page, "Certificate of Completion", H - 186, display, 40, INK);
  centered(page, "This certifies that", H - 232, italic, 15, MUTED);

  const nameFont = pickFont(input.recipientName, display, sansBold);
  centered(page, input.recipientName, H - 288, nameFont, 38, INK, 600);
  page.drawLine({ start: { x: cx - 170, y: H - 302 }, end: { x: cx + 170, y: H - 302 }, thickness: 0.6, color: GOLD });

  centered(page, "has faithfully completed the course", H - 334, italic, 15, MUTED);
  const titleFont = pickFont(input.courseTitle, display, sansBold);
  const titleLines = wrap(safeText(input.courseTitle, titleFont), titleFont, 24, 600).slice(0, 2);
  titleLines.forEach((line, i) => centered(page, line, H - 372 - i * 30, titleFont, 24, PRIMARY));

  // Footer: date | signatory | instructor
  const footY = 112;
  const cols = [
    { label: "Date completed", value: input.completedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) },
    input.signatoryName ? { label: input.signatoryTitle ?? "On behalf of the church", value: input.signatoryName } : null,
    input.instructorName ? { label: "Instructor", value: input.instructorName } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const colW = 200;
  const startX = cx - (cols.length * colW) / 2;
  cols.forEach((c, i) => {
    const x = startX + i * colW + colW / 2;
    const vf = pickFont(c.value, italic, sans);
    const v = safeText(c.value, vf);
    let size = 14;
    while (vf.widthOfTextAtSize(v, size) > colW - 24 && size > 9) size--;
    page.drawText(v, { x: x - vf.widthOfTextAtSize(v, size) / 2, y: footY + 10, size, font: vf, color: INK });
    page.drawLine({ start: { x: x - 75, y: footY }, end: { x: x + 75, y: footY }, thickness: 0.5, color: MUTED });
    const l = safeText(c.label, sans);
    page.drawText(l, { x: x - sans.widthOfTextAtSize(l, 8.5) / 2, y: footY - 14, size: 8.5, font: sans, color: MUTED });
  });

  const verify = `Certificate ${input.code}  ·  Verify at ${input.verifyUrl}`;
  centered(page, verify, 50, sans, 8.5, MUTED, 700);

  return doc.save();
}
