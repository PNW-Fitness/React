import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { WAIVER_TEXT } from "../waiverText.js";

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

export async function generateWaiverPdf({ formData, isMinor, signatureDataUrl, signedAt, guestId }) {
  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BOTTOM_SAFE = MARGIN + 36;

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function ensureSpace(needed) {
    if (y - needed < BOTTOM_SAFE) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function drawText(text, font, size, color = rgb(0, 0, 0), x = MARGIN) {
    ensureSpace(size + 6);
    page.drawText(text, { x, y: y - size, size, font, color });
    y -= size * 1.55;
  }

  function drawWrapped(text, font, size, color = rgb(0.15, 0.15, 0.15), xOffset = 0) {
    for (const rawLine of text.split("\n")) {
      if (!rawLine.trim()) {
        y -= size * 0.5;
        continue;
      }
      const wrapped = wrapLine(rawLine, font, size, CONTENT_W - xOffset);
      for (const line of wrapped) {
        ensureSpace(size + 4);
        page.drawText(line, { x: MARGIN + xOffset, y: y - size, size, font, color });
        y -= size * 1.5;
      }
    }
  }

  function drawHRule() {
    ensureSpace(16);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 0.5,
      color: rgb(0.65, 0.65, 0.65),
    });
    y -= 16;
  }

  // ── Header ──────────────────────────────────────────────────────────────
  drawText("Pacific Northwest Fitness", bold, 18, rgb(0.1, 0.17, 0.29));
  drawText("Guest Waiver & Liability Release", regular, 12, rgb(0.35, 0.35, 0.35));
  drawHRule();

  // ── Guest info ───────────────────────────────────────────────────────────
  y -= 4;
  const guestName = `${formData.first_name} ${formData.last_name}`;
  drawText(`Guest: ${guestName}`, bold, 12);
  drawText(`Visit reason: ${formData.visit_reason}`, regular, 11);
  drawText(`Date signed: ${signedAt}`, regular, 11);
  drawText(`Record #${guestId}`, regular, 10, rgb(0.5, 0.5, 0.5));

  if (isMinor) {
    y -= 4;
    drawText("MINOR GUEST — waiver signed by guardian:", bold, 11, rgb(0.55, 0.28, 0.05));
    drawText(`  Guardian: ${formData.guardian_name}`, regular, 11, rgb(0.55, 0.28, 0.05));
    if (formData.guardian_phone) {
      drawText(`  Phone: ${formData.guardian_phone}`, regular, 11, rgb(0.55, 0.28, 0.05));
    }
  }

  y -= 8;
  drawHRule();

  // ── Waiver text ──────────────────────────────────────────────────────────
  const sections = WAIVER_TEXT.split("\n\n");
  for (const section of sections) {
    const nl = section.indexOf("\n");
    const title = nl === -1 ? section : section.slice(0, nl);
    const body = nl === -1 ? "" : section.slice(nl + 1);
    y -= 6;
    drawText(title, bold, 11, rgb(0, 0, 0));
    if (body) drawWrapped(body, regular, 10);
  }

  y -= 10;
  drawHRule();

  // ── Signature ────────────────────────────────────────────────────────────
  const sigLabel = isMinor ? "Guardian Signature" : "Guest Signature";
  const signerDisplay = isMinor
    ? `${formData.guardian_name} (guardian of ${guestName})`
    : guestName;

  drawText(sigLabel, bold, 12);

  const sigPngBytes = dataUrlToUint8Array(signatureDataUrl);
  const sigImage = await pdfDoc.embedPng(sigPngBytes);

  const SIG_MAX_W = CONTENT_W * 0.65;
  const SIG_MAX_H = 100;
  const scale = Math.min(SIG_MAX_W / sigImage.width, SIG_MAX_H / sigImage.height, 1);
  const sigW = sigImage.width * scale;
  const sigH = sigImage.height * scale;

  ensureSpace(sigH + 52);

  page.drawRectangle({
    x: MARGIN - 1,
    y: y - sigH - 6,
    width: SIG_MAX_W + 10,
    height: sigH + 10,
    borderColor: rgb(0.78, 0.78, 0.78),
    borderWidth: 0.5,
    color: rgb(0.985, 0.985, 0.985),
  });

  page.drawImage(sigImage, {
    x: MARGIN + 4,
    y: y - sigH - 1,
    width: sigW,
    height: sigH,
  });

  y -= sigH + 14;

  drawText(signerDisplay, bold, 11);
  drawText(`Signed: ${signedAt}`, regular, 10, rgb(0.4, 0.4, 0.4));

  return await pdfDoc.save();
}
