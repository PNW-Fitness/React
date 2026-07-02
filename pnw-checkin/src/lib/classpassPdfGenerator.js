import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CLASSPASS_WAIVER_TEXT } from "./classpassWaiverText.js";

// ── Utilities ────────────────────────────────────────────────────────────────

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

// Estimates height for paragraph-style waiver text (no section headers).
function measureParagraphsHeight(paragraphs, font, fontSize, contentWidth) {
  let h = 0;
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    h += wrapLine(trimmed, font, fontSize, contentWidth).length * fontSize * 1.4;
    h += 6; // gap after paragraph
  }
  return h;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateClassPassPdf({
  guestName, contact, zipCode,
  signatureDataUrl, signedAt, checkinId, idPhoto,
}) {
  // ── Page geometry ────────────────────────────────────────────────────────────
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  const DIV_Y   = 356;
  const MID_X   = PAGE_W / 2;
  const COL_IN  = 10;

  const LEFT_X  = MARGIN;
  const LEFT_W  = MID_X - MARGIN - COL_IN;
  const RIGHT_X = MID_X + COL_IN;
  const RIGHT_W = PAGE_W - MARGIN - RIGHT_X;

  const BOT_TOP = DIV_Y - 10;
  const BOT_BTM = MARGIN;
  const BOT_H   = BOT_TOP - BOT_BTM;

  // ── Colors ───────────────────────────────────────────────────────────────────
  const C_DARK  = rgb(0.1,  0.17, 0.29);
  const C_GRAY  = rgb(0.5,  0.5,  0.5);
  const C_BLACK = rgb(0,    0,    0);
  const C_BODY  = rgb(0.15, 0.15, 0.15);
  const C_RULE  = rgb(0.72, 0.72, 0.72);
  const C_GREEN = rgb(0.05, 0.5,  0.15);

  const pdfDoc  = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page    = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // ── Header ───────────────────────────────────────────────────────────────────
  const HDR_SZ = 7.5;
  const HDR_Y  = PAGE_H - MARGIN - HDR_SZ;
  const rText  = `${signedAt}  ·  Check-in #${checkinId}`;
  page.drawText("Pacific Northwest Fitness  ·  ClassPass Waiver & Liability Release", {
    x: MARGIN, y: HDR_Y, size: HDR_SZ, font: bold, color: C_DARK,
  });
  page.drawText(rText, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(rText, HDR_SZ),
    y: HDR_Y, size: HDR_SZ, font: regular, color: C_GRAY,
  });
  const HDR_RULE_Y = HDR_Y - 10;
  page.drawLine({
    start: { x: MARGIN, y: HDR_RULE_Y }, end: { x: PAGE_W - MARGIN, y: HDR_RULE_Y },
    thickness: 0.5, color: C_RULE,
  });

  // ── ClassPass waiver text (paragraph-style, auto-sized) ──────────────────────
  const WAIVER_TOP = HDR_RULE_Y - 6;
  const WAIVER_BTM = DIV_Y + 8;
  const AVAIL_H    = WAIVER_TOP - WAIVER_BTM;

  const paragraphs = CLASSPASS_WAIVER_TEXT.split("\n\n");
  let wSz = 10;
  for (const sz of [10, 9, 8, 7.5, 7]) {
    if (measureParagraphsHeight(paragraphs, regular, sz, CONTENT_W) <= AVAIL_H) {
      wSz = sz;
      break;
    }
  }

  let wy = WAIVER_TOP;
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    for (const line of wrapLine(trimmed, regular, wSz, CONTENT_W)) {
      if (wy - wSz < WAIVER_BTM) break;
      page.drawText(line, { x: MARGIN, y: wy - wSz, size: wSz, font: regular, color: C_BODY });
      wy -= wSz * 1.4;
    }
    wy -= 6; // paragraph gap
  }

  // ── Dividers ──────────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: MARGIN, y: DIV_Y }, end: { x: PAGE_W - MARGIN, y: DIV_Y },
    thickness: 0.75, color: C_RULE,
  });
  page.drawLine({
    start: { x: MID_X, y: DIV_Y - 2 }, end: { x: MID_X, y: BOT_BTM },
    thickness: 0.75, color: C_RULE,
  });

  // ── Bottom-left: ID photo + signature ────────────────────────────────────────
  let leftY = BOT_TOP;

  if (idPhoto) {
    page.drawText("VERIFIED ID", {
      x: LEFT_X, y: leftY - 7, size: 6.5, font: bold, color: C_GRAY,
    });
    leftY -= 13;

    const idBytes = dataUrlToUint8Array(idPhoto);
    const isJpeg  = idPhoto.startsWith("data:image/jpeg") || idPhoto.startsWith("data:image/jpg");
    const idImg   = isJpeg ? await pdfDoc.embedJpg(idBytes) : await pdfDoc.embedPng(idBytes);
    const idMaxH  = Math.round(BOT_H * 0.52);
    const idScale = Math.min(LEFT_W / idImg.width, idMaxH / idImg.height, 1);
    const idW = idImg.width * idScale, idH = idImg.height * idScale;
    page.drawImage(idImg, { x: LEFT_X, y: leftY - idH, width: idW, height: idH });
    leftY -= idH + 8;
  }

  page.drawText("SIGNATURE", { x: LEFT_X, y: leftY - 7, size: 6.5, font: bold, color: C_GRAY });
  leftY -= 13;

  const sigBytes = dataUrlToUint8Array(signatureDataUrl);
  const sigImg   = await pdfDoc.embedPng(sigBytes);
  const sigMaxH  = Math.max(leftY - BOT_BTM - 22, 36);
  const sigScale = Math.min(LEFT_W / sigImg.width, sigMaxH / sigImg.height, 1);
  const sigW = sigImg.width * sigScale, sigH = sigImg.height * sigScale;

  page.drawRectangle({
    x: LEFT_X, y: leftY - sigH - 3, width: LEFT_W, height: sigH + 3,
    borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5, color: rgb(0.985, 0.985, 0.985),
  });
  page.drawImage(sigImg, { x: LEFT_X + 2, y: leftY - sigH - 1, width: sigW, height: sigH });
  leftY -= sigH + 5;

  if (leftY - 7 > BOT_BTM) {
    page.drawText(guestName, { x: LEFT_X, y: leftY - 7, size: 7, font: bold, color: C_BLACK });
    leftY -= 11;
  }
  if (leftY - 7 > BOT_BTM) {
    page.drawText(`Signed: ${signedAt}`, { x: LEFT_X, y: leftY - 7, size: 7, font: regular, color: C_GRAY });
  }

  // ── Bottom-right: ClassPass guest info ────────────────────────────────────────
  let rightY   = BOT_TOP;
  const infoSz = 9;

  function drawField(label, value, vColor = C_BLACK) {
    if (!value || rightY - infoSz < BOT_BTM) return;
    const lText = `${label}: `;
    const lW    = bold.widthOfTextAtSize(lText, infoSz);
    page.drawText(lText, { x: RIGHT_X, y: rightY - infoSz, size: infoSz, font: bold, color: C_GRAY });
    const lines = wrapLine(String(value), regular, infoSz, RIGHT_W - lW);
    if (lines.length > 0) {
      page.drawText(lines[0], { x: RIGHT_X + lW, y: rightY - infoSz, size: infoSz, font: regular, color: vColor });
    }
    rightY -= infoSz * 1.4;
    for (let i = 1; i < lines.length; i++) {
      if (rightY - infoSz < BOT_BTM) break;
      page.drawText(lines[i], { x: RIGHT_X + lW, y: rightY - infoSz, size: infoSz, font: regular, color: vColor });
      rightY -= infoSz * 1.4;
    }
  }

  page.drawText("CLASSPASS GUEST", {
    x: RIGHT_X, y: rightY - 7, size: 6.5, font: bold, color: C_GRAY,
  });
  rightY -= 15;

  drawField("Name",    guestName);
  drawField("Contact", contact);
  drawField("Zip",     zipCode);

  // Booking verification note — draw checkmark as lines (✓ is outside WinAnsi)
  rightY -= 4;
  if (rightY - 8 > BOT_BTM) {
    const chkBaseline = rightY - 8;
    const chkX = RIGHT_X;
    const chkSz = 5;
    page.drawLine({
      start: { x: chkX,                    y: chkBaseline + chkSz * 0.4 },
      end:   { x: chkX + chkSz * 0.35,     y: chkBaseline },
      thickness: 1.5, color: C_GREEN,
    });
    page.drawLine({
      start: { x: chkX + chkSz * 0.35,     y: chkBaseline },
      end:   { x: chkX + chkSz,             y: chkBaseline + chkSz * 0.8 },
      thickness: 1.5, color: C_GREEN,
    });
    page.drawText("Booking verified by staff", {
      x: RIGHT_X + chkSz + 4, y: chkBaseline, size: 8, font: bold, color: C_GREEN,
    });
  }

  return await pdfDoc.save();
}
