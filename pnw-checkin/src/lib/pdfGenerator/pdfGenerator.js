import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { WAIVER_TEXT } from "../waiverText.js";

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

// Estimates total height consumed by waiver sections at a given font size.
function measureWaiverHeight(sections, boldFont, regularFont, fontSize, contentWidth) {
  let h = 0;
  for (const section of sections) {
    const nl = section.indexOf("\n");
    const body = nl === -1 ? "" : section.slice(nl + 1);
    h += 5;                        // pre-section gap
    h += fontSize * 1.45;          // title
    if (body) {
      for (const rawLine of body.split("\n")) {
        if (!rawLine.trim()) { h += fontSize * 0.4; continue; }
        h += wrapLine(rawLine, regularFont, fontSize, contentWidth).length * fontSize * 1.4;
      }
    }
  }
  return h;
}

// ── Main export ──────────────────────────────────────────────────────────────

export async function generateWaiverPdf({
  formData, isMinor, supervisionRequired,
  signatureDataUrl, signedAt, guestId, idPhoto,
  idDeclined = false, declinedAt = "",
}) {
  // ── Page geometry ───────────────────────────────────────────────────────────
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 36;
  const CONTENT_W = PAGE_W - MARGIN * 2;   // 540

  const DIV_Y    = 356;                     // horizontal rule: 55% top / 45% bottom
  const MID_X    = PAGE_W / 2;             // 306 — vertical rule
  const COL_IN   = 10;                      // clearance between divider and column text

  const LEFT_X   = MARGIN;
  const LEFT_W   = MID_X - MARGIN - COL_IN;         // 260
  const RIGHT_X  = MID_X + COL_IN;                   // 316
  const RIGHT_W  = PAGE_W - MARGIN - RIGHT_X;        // 260

  const BOT_TOP  = DIV_Y - 10;             // where bottom columns start
  const BOT_BTM  = MARGIN;                 // bottom of page (excl. margin)
  const BOT_H    = BOT_TOP - BOT_BTM;      // ~310

  // ── Colors ───────────────────────────────────────────────────────────────────
  const C_DARK  = rgb(0.1,  0.17, 0.29);
  const C_GRAY  = rgb(0.5,  0.5,  0.5);
  const C_BLACK = rgb(0,    0,    0);
  const C_BODY  = rgb(0.15, 0.15, 0.15);
  const C_RULE  = rgb(0.72, 0.72, 0.72);
  const C_WARN  = rgb(0.55, 0.28, 0.05);

  const pdfDoc  = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page    = pdfDoc.addPage([PAGE_W, PAGE_H]);

  const guestName = `${formData.first_name} ${formData.last_name}`;

  // ── Header ───────────────────────────────────────────────────────────────────
  const HDR_SZ  = 7.5;
  const HDR_Y   = PAGE_H - MARGIN - HDR_SZ;
  const rText   = `${signedAt}  ·  Record #${guestId}`;
  page.drawText("Pacific Northwest Fitness  ·  Guest Waiver & Liability Release", {
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

  // ── Waiver text (auto-sized to fit top zone) ─────────────────────────────────
  const WAIVER_TOP = HDR_RULE_Y - 6;
  const WAIVER_BTM = DIV_Y + 8;
  const AVAIL_H    = WAIVER_TOP - WAIVER_BTM;

  const sections = WAIVER_TEXT.split("\n\n");
  let wSz = 6.5;
  for (const sz of [8, 7.5, 7, 6.5]) {
    if (measureWaiverHeight(sections, bold, regular, sz, CONTENT_W) <= AVAIL_H) {
      wSz = sz;
      break;
    }
  }

  let wy = WAIVER_TOP;
  for (const section of sections) {
    const nl    = section.indexOf("\n");
    const title = nl === -1 ? section : section.slice(0, nl);
    const body  = nl === -1 ? "" : section.slice(nl + 1);
    wy -= 5;
    if (wy - wSz < WAIVER_BTM) break;
    page.drawText(title, { x: MARGIN, y: wy - wSz, size: wSz, font: bold, color: C_BLACK });
    wy -= wSz * 1.45;
    if (body) {
      for (const rawLine of body.split("\n")) {
        if (!rawLine.trim()) { wy -= wSz * 0.4; continue; }
        for (const line of wrapLine(rawLine, regular, wSz, CONTENT_W)) {
          if (wy - wSz < WAIVER_BTM) break;
          page.drawText(line, { x: MARGIN, y: wy - wSz, size: wSz, font: regular, color: C_BODY });
          wy -= wSz * 1.4;
        }
      }
    }
  }

  // ── Dividers ──────────────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: MARGIN,  y: DIV_Y }, end: { x: PAGE_W - MARGIN, y: DIV_Y },
    thickness: 0.75, color: C_RULE,
  });
  page.drawLine({
    start: { x: MID_X, y: DIV_Y - 2 }, end: { x: MID_X, y: BOT_BTM },
    thickness: 0.75, color: C_RULE,
  });

  // ── Bottom-left: ID photo / decline notice + signature ──────────────────────
  let leftY = BOT_TOP;

  if (idDeclined) {
    const C_DEC_BG     = rgb(1, 0.94, 0.94);
    const C_DEC_BORDER = rgb(0.82, 0.12, 0.12);
    const C_DEC_TITLE  = rgb(0.7, 0.05, 0.05);
    const C_DEC_BODY   = rgb(0.45, 0.05, 0.05);

    const DEC_TITLE_SZ = 8.5;
    const DEC_BODY_SZ  = 7.5;
    const DEC_LEAD     = DEC_BODY_SZ * 1.4;
    const DEC_PAD      = 8;

    const bodyLines = [
      ...wrapLine("Guest refused to provide identification at check-in.", regular, DEC_BODY_SZ, LEFT_W - DEC_PAD * 2),
      ...wrapLine("This check-in is not considered complete.", regular, DEC_BODY_SZ, LEFT_W - DEC_PAD * 2),
    ];
    const decH = DEC_PAD + DEC_TITLE_SZ * 1.5 + bodyLines.length * DEC_LEAD
                 + (declinedAt ? DEC_BODY_SZ * 1.5 + 4 : 0) + DEC_PAD;

    page.drawRectangle({
      x: LEFT_X - 2, y: leftY - decH - 2, width: LEFT_W + 4, height: decH + 2,
      color: C_DEC_BG, borderColor: C_DEC_BORDER, borderWidth: 1,
    });

    let decY = leftY - DEC_PAD;
    page.drawText("ID VERIFICATION DECLINED", {
      x: LEFT_X + DEC_PAD, y: decY - DEC_TITLE_SZ, size: DEC_TITLE_SZ, font: bold, color: C_DEC_TITLE,
    });
    decY -= DEC_TITLE_SZ * 1.5;

    for (const line of bodyLines) {
      page.drawText(line, { x: LEFT_X + DEC_PAD, y: decY - DEC_BODY_SZ, size: DEC_BODY_SZ, font: regular, color: C_DEC_BODY });
      decY -= DEC_LEAD;
    }

    if (declinedAt) {
      decY -= 4;
      page.drawText(`Declined: ${declinedAt}`, {
        x: LEFT_X + DEC_PAD, y: decY - DEC_BODY_SZ, size: DEC_BODY_SZ, font: regular, color: C_GRAY,
      });
    }

    leftY -= decH + 12;
  } else if (idPhoto) {
    page.drawText("VERIFIED ID", {
      x: LEFT_X, y: leftY - 7, size: 6.5, font: bold, color: C_GRAY,
    });
    leftY -= 13;

    const idBytes  = dataUrlToUint8Array(idPhoto);
    const isJpeg   = idPhoto.startsWith("data:image/jpeg") || idPhoto.startsWith("data:image/jpg");
    const idImg    = isJpeg ? await pdfDoc.embedJpg(idBytes) : await pdfDoc.embedPng(idBytes);
    const idMaxH   = Math.round(BOT_H * 0.52);
    const idScale  = Math.min(LEFT_W / idImg.width, idMaxH / idImg.height, 1);
    const idW = idImg.width * idScale, idH = idImg.height * idScale;
    page.drawImage(idImg, { x: LEFT_X, y: leftY - idH, width: idW, height: idH });
    leftY -= idH + 8;
  }

  const sigLabel = isMinor ? "GUARDIAN SIGNATURE" : "SIGNATURE";
  page.drawText(sigLabel, { x: LEFT_X, y: leftY - 7, size: 6.5, font: bold, color: C_GRAY });
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

  const signerName = isMinor ? `${formData.guardian_name} (guardian)` : guestName;
  if (leftY - 7 > BOT_BTM) {
    page.drawText(signerName, { x: LEFT_X, y: leftY - 7, size: 7, font: bold, color: C_BLACK });
    leftY -= 11;
  }
  if (leftY - 7 > BOT_BTM) {
    page.drawText(`Signed: ${signedAt}`, { x: LEFT_X, y: leftY - 7, size: 7, font: regular, color: C_GRAY });
  }

  // ── Bottom-right: guest information ──────────────────────────────────────────
  let rightY    = BOT_TOP;
  const infoSz  = 9;

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

  page.drawText("GUEST INFORMATION", {
    x: RIGHT_X, y: rightY - 7, size: 6.5, font: bold, color: C_GRAY,
  });
  rightY -= 15;

  drawField("Name", guestName);

  const rawPhone = (formData.phone || "").replace(/\D/g, "").slice(-10);
  const fmtPhone = rawPhone.length === 10
    ? `(${rawPhone.slice(0, 3)}) ${rawPhone.slice(3, 6)}-${rawPhone.slice(6)}`
    : (formData.phone || "");
  drawField("Phone", fmtPhone);
  drawField("Email", formData.email);
  drawField("Zip", formData.zip_code);
  drawField("Visit Reason", formData.visit_reason);

  if (formData.how_heard) {
    drawField(
      "How Heard",
      formData.how_heard_specify
        ? `${formData.how_heard} — ${formData.how_heard_specify}`
        : formData.how_heard
    );
  }

  if (formData.interests) {
    let ints = formData.interests;
    if (typeof ints === "string" && ints) try { ints = JSON.parse(ints); } catch {}
    if (Array.isArray(ints) && ints.length > 0) {
      drawField("Interests", ints.join(", "));
    }
  }

  if (isMinor) {
    rightY -= 4;
    if (rightY - 8 > BOT_BTM) {
      page.drawText("MINOR GUEST", { x: RIGHT_X, y: rightY - 8, size: 8, font: bold, color: C_WARN });
      rightY -= 14;
    }
    drawField("Guardian", formData.guardian_name, C_WARN);
    if (formData.guardian_phone) {
      const gpRaw = (formData.guardian_phone || "").replace(/\D/g, "").slice(-10);
      const gpFmt = gpRaw.length === 10
        ? `(${gpRaw.slice(0, 3)}) ${gpRaw.slice(3, 6)}-${gpRaw.slice(6)}`
        : formData.guardian_phone;
      drawField("Guardian Ph.", gpFmt, C_WARN);
    }
    if (supervisionRequired) {
      rightY -= 2;
      const note = "Note: Guardian or trainer supervision required at all times";
      for (const line of wrapLine(note, regular, 7.5, RIGHT_W)) {
        if (rightY - 7.5 < BOT_BTM) break;
        page.drawText(line, { x: RIGHT_X, y: rightY - 7.5, size: 7.5, font: regular, color: C_WARN });
        rightY -= 11;
      }
    }
  }

  return await pdfDoc.save();
}
