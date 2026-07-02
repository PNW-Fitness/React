import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { TANNING_WAIVER_TEXT } from "./tanningWaiverText.js";

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function wrapLine(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateTanningPdf({ fullName, contact, zipCode, signatureDataUrl, signedAt, checkinId }) {
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const C_DARK  = rgb(0.1,  0.17, 0.29);
  const C_GRAY  = rgb(0.45, 0.45, 0.45);
  const C_BLACK = rgb(0,    0,    0);
  const C_RULE  = rgb(0.8,  0.8,  0.8);
  const C_AMBER = rgb(0.85, 0.55, 0.05);

  const pdfDoc  = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page    = pdfDoc.addPage([PAGE_W, PAGE_H]);

  let y = PAGE_H - MARGIN;

  // ── Header ────────────────────────────────────────────────────────────────
  page.drawText("PACIFIC NORTHWEST FITNESS", {
    x: MARGIN, y, font: bold, size: 13, color: C_DARK,
  });
  y -= 16;
  page.drawText("Tanning Release and Consent Form", {
    x: MARGIN, y, font: regular, size: 10, color: C_AMBER,
  });
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: C_AMBER });
  y -= 14;

  // ── Member info ───────────────────────────────────────────────────────────
  const INFO_SZ = 9;
  const COL2 = MARGIN + CONTENT_W / 2;

  page.drawText(`Name: ${fullName}`, { x: MARGIN, y, font: bold, size: INFO_SZ, color: C_DARK });
  page.drawText(`Date: ${signedAt.split(" ")[0]}`, { x: COL2, y, font: regular, size: INFO_SZ, color: C_GRAY });
  y -= 13;
  page.drawText(`Contact: ${contact}`, { x: MARGIN, y, font: regular, size: INFO_SZ, color: C_GRAY });
  page.drawText(`Zip Code: ${zipCode}`, { x: COL2, y, font: regular, size: INFO_SZ, color: C_GRAY });
  y -= 13;
  page.drawText(`Record #: ${checkinId}`, { x: MARGIN, y, font: regular, size: INFO_SZ, color: C_GRAY });
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: C_RULE });
  y -= 12;

  // ── Waiver body ───────────────────────────────────────────────────────────
  const BODY_SZ = 8;
  const LINE_H  = BODY_SZ * 1.45;
  const SECTION_GAP = 6;
  const PARA_GAP = 5;

  for (const rawLine of TANNING_WAIVER_TEXT.split("\n")) {
    const line = rawLine.trim();
    if (!line) { y -= PARA_GAP; continue; }

    const isSection = line === line.toUpperCase() && line.length > 3;
    const font = isSection ? bold : regular;
    const size = isSection ? BODY_SZ + 0.5 : BODY_SZ;
    const color = isSection ? C_DARK : C_BLACK;

    if (isSection) y -= 2;

    const wrapped = wrapLine(line, font, size, CONTENT_W);
    for (const wl of wrapped) {
      if (y < MARGIN + 80) break; // leave room for signature block
      page.drawText(wl, { x: MARGIN, y, font, size, color });
      y -= LINE_H;
    }

    if (isSection) y -= 2;
  }

  // ── Signature block ───────────────────────────────────────────────────────
  const SIG_TOP = Math.min(y - 10, MARGIN + 75);

  page.drawLine({
    start: { x: MARGIN, y: SIG_TOP },
    end:   { x: PAGE_W - MARGIN, y: SIG_TOP },
    thickness: 0.5, color: C_RULE,
  });

  const sigY = SIG_TOP - 14;
  page.drawText("Member Signature:", { x: MARGIN, y: sigY, font: bold, size: 8, color: C_DARK });
  page.drawText(`Signed: ${signedAt}`, {
    x: COL2, y: sigY, font: regular, size: 8, color: C_GRAY,
  });

  if (signatureDataUrl) {
    try {
      const sigBytes = dataUrlToUint8Array(signatureDataUrl);
      const sigImg = await pdfDoc.embedPng(sigBytes);
      const sigDims = sigImg.scaleToFit(180, 40);
      page.drawImage(sigImg, {
        x: MARGIN,
        y: sigY - sigDims.height - 4,
        width: sigDims.width,
        height: sigDims.height,
      });
    } catch { /* skip if signature can't be embedded */ }
  }

  return await pdfDoc.save();
}
